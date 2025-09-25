import os, sys
from dotenv import load_dotenv
from openai import OpenAI

load_dotenv()
client = OpenAI(api_key=os.getenv("OPENAI_API_KEY"))
GPT_MODEL = "gpt-4o"


def load_prompt(path: str) -> str:
    try:
        with open(path, "r", encoding="utf-8") as f:
            return f.read().strip()
    except FileNotFoundError:
        print("Prompt file was not found!")
        return ""           

def main():
    #loading prompts
    system_prompt = load_prompt("prompts/system_prompt.txt")
    user_prompt = load_prompt("prompts/user_prompt.txt")

    query = []
    query.append({"role": "system", "content": system_prompt})
    query.append({"role": "user", "content": user_prompt})

    resp = client.responses.create(
        model=GPT_MODEL,
        input=query,                
        tools=[{"type": "web_search"}]  # enable hosted web search
    )
    
    print("\n=== Answer ===")
    # output_text is the convenience property for the assistant's text
    print(getattr(resp, "output_text", "").strip())

    # usage is a model object; access attributes safely with getattr
    usage = getattr(resp, "usage", None)
    input_tokens  = getattr(usage, "input_tokens", 0) if usage else 0
    output_tokens = getattr(usage, "output_tokens", 0) if usage else 0
    total_tokens  = getattr(usage, "total_tokens", None) if usage else None

    print("\n=== Usage ===")
    print(f"Input tokens:  {input_tokens}")
    print(f"Output tokens: {output_tokens}")
    if total_tokens is not None:
        print(f"Total tokens:  {total_tokens}") 

if __name__ == "__main__":
    main()
