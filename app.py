import os, sys
from dotenv import load_dotenv
from openai import OpenAI

load_dotenv()
client = OpenAI(api_key=os.getenv("OPENAI_API_KEY"))

def main():
    query = " ".join(sys.argv[1:]) or input("Your question: ")
    resp = client.responses.create(
        model="gpt-4o-mini",
        input=query,                 # simplest form
        tools=[{"type": "web_search"}]  # enable hosted web search
    )
    print(resp.output_text)          # just print the text; ignore citations for now

if __name__ == "__main__":
    main()
