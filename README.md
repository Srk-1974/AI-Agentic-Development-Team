# AI Agentic Development Team

A multi-agent AI system with a Graphical User Interface (GUI) built using **CrewAI** and **Streamlit**. It uses three specialized AI agents (Decision Maker, Developer, and Tester) to automatically plan, write code, and generate tests for any task you provide.

## Features

- 🤖 **Decision Maker Agent** - Analyzes your request and creates a detailed technical plan.
- 👨‍💻 **Developer Agent** - Writes clean, well-documented code based on the plan.
- ✅ **Tester Agent** - Writes comprehensive unit tests for the generated code.
- 🖥️ **Streamlit GUI** - An easy-to-use web interface to interact with the agents.
- 🔀 **Multiple LLM Providers** - Supports Google Gemini, OpenAI, Groq, and xAI (Grok).

## Setup & Installation

### 1. Clone the repository
```bash
git clone https://github.com/Srk-1974/AI-Agentic-Development-Team.git
cd AI-Agentic-Development-Team
```

### 2. Install dependencies
```bash
pip install -r requirements.txt
```

### 3. Configure API Keys
Copy the `.env` file and add your API keys:
```
GEMINI_API_KEY="your_gemini_api_key"
OPENAI_API_KEY="your_openai_api_key"
GROQ_API_KEY="your_groq_api_key"
XAI_API_KEY="your_xai_api_key"
```
You only need to provide the key for the provider you want to use. Get a free Gemini API key from [Google AI Studio](https://aistudio.google.com/app/apikey).

### 4. Run the app
```bash
streamlit run main.py
```

## Usage

1. Open the app in your browser (usually `http://localhost:8501`).
2. Select your **AI Provider** from the sidebar.
3. Enter your **API Key** in the sidebar.
4. Select or modify the **Model Name**.
5. Type your task in the main text area (e.g., *"Create a Python REST API for a todo list"*).
6. Click **Start Development Process** and watch the agents work!

## Supported Models

| Provider | Model Example |
|---|---|
| Google Gemini | `gemini/gemini-2.5-flash` |
| OpenAI | `gpt-4o` |
| Groq | `groq/llama3-70b-8192` |
| xAI (Grok) | `xai/grok-4.20-reasoning` |
