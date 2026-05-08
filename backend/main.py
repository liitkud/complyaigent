from fastapi import FastAPI


app = FastAPI()


@app.get("/status")
async def status():
    return {"status": "ok"}


if __name__ == "__main__":
    import uvicorn

    uvicorn.run("main:app", host="0.0.0.0", port=80, reload=False, log_level="info")
