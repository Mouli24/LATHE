import os
import httpx
import asyncio
from dotenv import load_dotenv

load_dotenv()

async def main():
    api_key = os.environ.get("GROQ_API_KEY")
    async with httpx.AsyncClient() as client:
        resp = await client.get(
            "https://api.groq.com/openai/v1/models",
            headers={"Authorization": f"Bearer {api_key}"}
        )
        print(resp.json())

if __name__ == "__main__":
    asyncio.run(main())
