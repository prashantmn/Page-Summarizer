# Page-Summarizer

Developed using Cursor using simple prompts, this Firefox extension provides quick, concise summaries of web pages and allows users to ask questions about the content.

Currently the model takes about 3-5 mins to summarize a typical web article. I'll optimize it in the coming days. 

Key Features:
Generates customizable bullet-point summaries of web pages
Text-to-speech functionality to read summaries aloud
AI-powered question-answering about the page content
User-friendly popup interface

## Setting Up the Server

1. Navigate to the directory where you downloaded source
2. Install the required packages. I suggest using conda environment, but this is optional, OR do a 'pip install -r requirements.txt'
3. Start the server: python server.py
4. Ensure the server is running at http://localhost:5000 for the extension to function properly.

## Using the Extension

1. Open Firefox and navigate to 'about:debugging'
2. Click on "This Firefox" in the left sidebar and click on "Load Temporary Add-on".
3. Navigate to the extension's directory and select the manifest.json file.
4. Click on the extension icon in your Firefox toolbar to open the popup.

![image](https://github.com/user-attachments/assets/96259b38-7e4b-40c2-b6f4-31eb1f0879d7)

![image](https://github.com/user-attachments/assets/e9b6a1ba-7685-4efd-9581-fc39740193dc)



