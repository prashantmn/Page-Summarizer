from flask import Flask, request, jsonify
from flask_cors import CORS
from transformers import pipeline, AutoTokenizer
import spacy
import logging
import sys

app = Flask(__name__)
CORS(app)

# Set up logging
logging.basicConfig(level=logging.DEBUG)

# Load spaCy model
try:
    nlp = spacy.load("en_core_web_sm")
    logging.info("Loaded spaCy model successfully")
except Exception as e:
    logging.error(f"Failed to load spaCy model: {str(e)}")
    nlp = None

# Set up the summarization and QA models
try:
    model_name = "facebook/bart-large-cnn"
    tokenizer = AutoTokenizer.from_pretrained(model_name)
    summarizer = pipeline("summarization", model=model_name, tokenizer=tokenizer)
    qa_model = pipeline("question-answering", model="distilbert-base-cased-distilled-squad")
    logging.info("Loaded transformer models successfully")
except Exception as e:
    logging.error(f"Failed to load transformer models: {str(e)}")
    summarizer = None
    qa_model = None

def chunk_text(text, max_chunk_size=1000):
    if nlp is None:
        return [text]
    doc = nlp(text)
    sentences = [sent.text for sent in doc.sents]
    chunks = []
    current_chunk = []
    current_size = 0
    for sentence in sentences:
        sentence_tokens = tokenizer.tokenize(sentence)
        if current_size + len(sentence_tokens) <= max_chunk_size:
            current_chunk.append(sentence)
            current_size += len(sentence_tokens)
        else:
            chunks.append(" ".join(current_chunk))
            current_chunk = [sentence]
            current_size = len(sentence_tokens)
    if current_chunk:
        chunks.append(" ".join(current_chunk))
    return chunks

@app.route('/summarize', methods=['POST'])
def summarize():
    logging.info("Received summarize request")
    data = request.json
    text = data['text']
    num_bullets = data['num_bullets']

    if summarizer is None:
        return jsonify({"error": "Summarization model not available"}), 500

    try:
        chunks = chunk_text(text)
        summaries = []
        for chunk in chunks:
            # Calculate dynamic max_length
            input_length = len(tokenizer.encode(chunk))
            max_length = min(150, max(30, input_length // 2))  # Ensure it's between 30 and 150
            
            summary = summarizer(chunk, max_length=max_length, min_length=20, do_sample=False)[0]['summary_text']
            summaries.append(summary)

        combined_summary = " ".join(summaries)
        doc = nlp(combined_summary)
        sentences = [sent.text for sent in doc.sents]
        bullets = sentences[:num_bullets]
        
        bullet_points = [f"<li>{sentence}</li>" for sentence in bullets]
        summary_html = f"<ul>{''.join(bullet_points)}</ul>"

        logging.info("Successfully generated summary")
        return jsonify({"summary": summary_html})
    except Exception as e:
        logging.error(f"Error in summarize: {str(e)}")
        return jsonify({"error": str(e)}), 500

@app.route('/answer', methods=['POST'])
def answer_question():
    logging.info("Received answer question request")
    data = request.json
    context = data['context']
    question = data['question']

    if qa_model is None:
        return jsonify({"error": "QA model not available"}), 500

    try:
        max_length = 512
        tokens = tokenizer.encode(context, truncation=True, max_length=max_length)
        truncated_context = tokenizer.decode(tokens)

        result = qa_model(question=question, context=truncated_context)

        logging.info("Successfully answered question")
        return jsonify({"answer": result['answer']})
    except Exception as e:
        logging.error(f"Error in answer_question: {str(e)}")
        return jsonify({"error": str(e)}), 500

@app.route('/debug', methods=['GET'])
def debug():
    info = {
        "Python version": sys.version,
        "Spacy model loaded": nlp is not None,
        "Summarizer model loaded": summarizer is not None,
        "QA model loaded": qa_model is not None,
    }
    return jsonify(info)

if __name__ == '__main__':
    logging.info(f"Starting server with Python {sys.version}")
    logging.info(f"Spacy model loaded: {nlp is not None}")
    logging.info(f"Summarizer model loaded: {summarizer is not None}")
    logging.info(f"QA model loaded: {qa_model is not None}")
    app.run(debug=True)
