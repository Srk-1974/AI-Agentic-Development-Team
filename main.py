import os
import streamlit as st
from crewai import Agent, Task, Crew, Process, LLM
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

# Set up the Streamlit page
st.set_page_config(page_title="AI Agentic Development Team", page_icon="🤖", layout="wide")
st.title("🤖 AI Agentic Development Team")
st.markdown("This system uses three AI agents (Decision Maker, Developer, and Tester) to automatically plan, code, and test your request.")

# Sidebar for Configuration
with st.sidebar:
    st.header("Configuration")
    provider = st.selectbox("Select AI Provider", ["Google Gemini", "OpenAI", "Groq", "xAI (Grok)"])
    
    if provider == "Google Gemini":
        env_var = "GEMINI_API_KEY"
        default_model = "gemini/gemini-2.5-pro"
    elif provider == "OpenAI":
        env_var = "OPENAI_API_KEY"
        default_model = "gpt-4o"
    elif provider == "Groq":
        env_var = "GROQ_API_KEY"
        default_model = "groq/llama3-70b-8192"
    elif provider == "xAI (Grok)":
        env_var = "XAI_API_KEY"
        default_model = "xai/grok-4.20-reasoning"
        
    model_name = st.text_input("Model Name", value=default_model)
    
    api_key = st.text_input(f"{provider} API Key", type="password", value=os.environ.get(env_var, ""))
    
    if api_key and "your_" not in api_key.lower():
        os.environ[env_var] = api_key

# Check for API Key
current_api_key = os.environ.get(env_var)
if not current_api_key or "your_" in current_api_key.lower():
    st.warning(f"Please enter your {provider} API Key in the sidebar or `.env` file to proceed.")
    st.stop()

# Initialize the LLM
try:
    llm = LLM(model=model_name, api_key=current_api_key, temperature=0.5)
except Exception as e:
    st.error(f"Error initializing {provider}: {e}")
    st.stop()

# User Input
user_task = st.text_area("What do you want the AI team to build?", placeholder="e.g. Create a simple Python calculator with basic arithmetic operations.")

if st.button("Start Development Process"):
    if not user_task:
        st.error("Please provide a task.")
    else:
        # Define Agents
        decision_maker = Agent(
            role='Lead Systems Analyst & Planner',
            goal='Break down the given user prompt into actionable coding and testing tasks.',
            backstory='You are an expert software architect. You excel at taking a vague user request, understanding the requirements, and creating a detailed technical plan.',
            verbose=True,
            allow_delegation=False,
            llm=llm
        )

        developer = Agent(
            role='Senior Software Engineer',
            goal='Write clean, efficient, and well-documented code based on the Decision Maker\'s plan.',
            backstory='You are a master programmer. You write highly optimized, elegant, and secure code. You follow best practices and always implement exactly what is in the technical plan.',
            verbose=True,
            allow_delegation=False,
            llm=llm
        )

        tester = Agent(
            role='Software Quality Assurance (QA) Engineer',
            goal='Write comprehensive test cases to validate the Developer\'s code.',
            backstory='You are a meticulous QA engineer. You think of edge cases, write thorough unit tests, and ensure the code is robust and bug-free.',
            verbose=True,
            allow_delegation=False,
            llm=llm
        )

        # Define Tasks
        plan_task = Task(
            description=f'Analyze this request: "{user_task}". Create a detailed technical plan and specification for what needs to be built.',
            expected_output='A markdown document containing the technical specification, including what features to build, what functions are needed, and how the system should work.',
            agent=decision_maker,
        )

        code_task = Task(
            description='Take the technical specification from the Decision Maker and write the actual complete code for it.',
            expected_output='The complete, working source code formatted as a code block. Include any necessary comments.',
            agent=developer,
        )

        test_task = Task(
            description='Review the code written by the Developer and write a complete suite of unit tests for it (e.g., using pytest or unittest).',
            expected_output='The complete testing code formatted as a code block. Explain how to run the tests.',
            agent=tester,
        )

        # Assemble the Crew
        crew = Crew(
            agents=[decision_maker, developer, tester],
            tasks=[plan_task, code_task, test_task],
            verbose=True,
            process=Process.sequential # Run tasks one after another
        )

        # Run the Process
        with st.spinner(f"🤖 The AI team (powered by {provider}) is working on your request... This may take a minute."):
            try:
                result = crew.kickoff()
                st.success("Development Complete!")
                
                # Display Results
                st.markdown("### Final Output")
                st.markdown(result)
            except Exception as e:
                error_msg = f"An error occurred during execution: {e}"
                
                if provider == "Google Gemini" and "NOT_FOUND" in str(e):
                    import requests
                    try:
                        res = requests.get(f"https://generativelanguage.googleapis.com/v1beta/models?key={os.environ.get('GEMINI_API_KEY')}").json()
                        available_models = [m['name'].replace('models/', '') for m in res.get('models', []) if 'generateContent' in m.get('supportedGenerationMethods', [])]
                        if available_models:
                            error_msg += f"\n\n**Tip: It looks like that specific model version is no longer active. Here are the valid Gemini models you can type into the 'Model Name' box on the left:**\n\n"
                            for m in available_models:
                                error_msg += f"- `gemini/{m}`\n"
                    except:
                        pass
                        
                st.error(error_msg)
