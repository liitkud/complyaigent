from llama_index.core import Document, StorageContext, SimpleDirectoryReader, Settings, VectorStoreIndex
from llama_index.core.ingestion import IngestionPipeline
from llama_index.core.node_parser import SentenceSplitter
from llama_index.vector_stores.milvus import MilvusVectorStore
from llama_index.embeddings.cohere import CohereEmbedding
from pydantic_settings import BaseSettings, SettingsConfigDict
from pathlib import Path
from pymilvus import MilvusClient
import os



BASE_DIR = Path(__file__).resolve().parent.parent.parent.parent
ENV_PATH = BASE_DIR / ".env"


class SettingsEnv(BaseSettings):
    model_config = SettingsConfigDict(
        env_file=ENV_PATH,
        env_file_encoding="utf-8",
        extra='ignore'
    )
    MILVUS_URI: str = ""
    MILVUS_TOKEN: str = ""
    COHERE_API_KEY: str = ""

settings = SettingsEnv()


vector_store = MilvusVectorStore(
    uri=settings.MILVUS_URI,
    token=settings.MILVUS_TOKEN,
    collection_name="complyaigent_collection",
    dim=1024,
    embedding_field="embeddings",
    overwrite=False,
    # overwrite=True,
    search_config={"nprobe": 60},
    similarity_metric="COSINE",
    consistency_level="Session",
)

# vector_store = MilvusVectorStore(
#     uri=settings.MILVUS_URI,
#     token=settings.MILVUS_TOKEN,
#     collection_name="complyaigent_collection",
#     embedding_field="embeddings",
#
# )

Settings.embed_model = CohereEmbedding(
    model_name="embed-multilingual-v3.0",
    api_key=settings.COHERE_API_KEY
)

sample_document = SimpleDirectoryReader(
    input_files=[str(BASE_DIR / "README.md")]
).load_data()

ingestion_pipeline = IngestionPipeline(
    transformations=[
        SentenceSplitter(chunk_size=300, chunk_overlap=40),
    ],vector_store=vector_store
)

# ingestion_pipeline.run(documents=sample_document)

index = VectorStoreIndex.from_vector_store(vector_store=vector_store)


retriever_engine = index.as_retriever(
    similarity_top_k=3,
)

query = retriever_engine.retrieve(
    "Alfeo"
)


for p in query:
    print(f"NODE ID: {p.node_id}\n---\n")
    print(f"TEXT/CONTENT: {p.text}\n---\n")
    print(f"SCORE: {p.score}\n---\n")
    print(f"METADATA: {p.metadata}\n---\n")

