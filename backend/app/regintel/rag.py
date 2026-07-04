from functools import lru_cache
from llama_index.core import SimpleDirectoryReader, VectorStoreIndex
from llama_index.core.node_parser import SentenceSplitter
from llama_index.core.schema import NodeWithScore
from llama_index.vector_stores.postgres import PGVectorStore
from llama_index.embeddings.cohere import CohereEmbedding
import sqlalchemy
from app.core.config import settings
from pathlib import Path
from ..core.lifespan import app_state


# Detect project root (where .env lives)
# rag.py is in backend/app/regintel/
BASE_DIR = Path(__file__).resolve().parent.parent.parent.parent





class VectorStoreConnection:
    def __init__(self):
        self.splitter = SentenceSplitter(chunk_size=512, chunk_overlap=60)
        self._index = None
        self.should_reset = False

    @property
    def vector_store(self):
        url = sqlalchemy.make_url(settings.DATABASE_URL)
        return PGVectorStore.from_params(
            host=url.host,
            port=str(url.port or 5432),
            user=url.username,
            password=url.password,
            database=url.database,
            table_name="regulations_vectors",
            embed_dim=1024,
        )

    @property
    def embedding_model(self):
        return CohereEmbedding(
            model_name=settings.EMBEDDING_MODEL, api_key=settings.COHERE_API_KEY
        )

    @property
    def index(self):
        if self._index is None:
            self._index = VectorStoreIndex.from_vector_store(
                vector_store=self.vector_store,
                embed_model=self.embedding_model,
                use_async=True,
            )
        return self._index

    def retrieve_data_from_vector_database(self, user_query: str):
        retriever_engine = self.index.as_retriever(similarity_top_k=3)
        raw_results = retriever_engine.retrieve(user_query)
        return self.list_nodes_to_str(raw_results)

    async def aretrieve_data_from_vector_database(self, user_query):
        retriever_engine = self.index.as_retriever(similarity_top_k=3)
        raw_results = await retriever_engine.aretrieve(user_query)
        return self.list_nodes_to_str(raw_results)

    async def vector_chat_async(self, query: str):
        user_context = await self.aretrieve_data_from_vector_database(query)

        system_prompt = """
        ## SYSTEM:
        You are a precise and reliable assistant. Answer the user's question 
        using ONLY the provided context below. If the context lacks sufficient 
        information, politely state that you cannot answer based on the given data.
        
        ## INSTRUCTIONS:
        Maintain a professional tone. Reference metadata when citing sources. 
        Do not fabricate information outside the provided context."""

        user_prompt = f"""
        ## CONTEXT:
        {user_context}
            
        ## USER QUERY:
        {query}
        """
        print(user_prompt)
        completion = await app_state.groq_client.chat.completions.create(
            model=settings.CHAT_MODEL,
            messages=[
                {"role": "system", "content": system_prompt},
                {"role": "user", "content": user_prompt},
            ],
            temperature=0.3,
            max_completion_tokens=8000,
            top_p=1,
            stop=None,
        )
        assistant_message = completion.choices[0].message
        return assistant_message.content

    def user_query_to_prompts(self, user_query: str):
        context = self.retrieve_data_from_vector_database(user_query)
        system_prompt = (
            "<System>\n"
            "You are a precise and reliable assistant. Answer the user's question "
            "using ONLY the provided context below. If the context lacks sufficient "
            "information, politely state that you cannot answer based on the given data.\n"
            "</System>\n\n"
        )
        user_prompt = (
            "<Context>\n"
            f"{context}\n"
            "</Context>\n\n"
            "<Instruction>\n"
            "Maintain a professional tone. Reference metadata when citing sources. "
            "Do not fabricate information outside the provided context.\n"
            "</Instruction>\n\n"
            f"<UserQuery>\n{user_query}\n</UserQuery>"
        )
        return system_prompt, user_prompt

    @staticmethod
    def list_nodes_to_str(input_list: list[NodeWithScore]):
        keys_to_remove = {"file_path"}

        final_parts = []

        for i in input_list:
            for key in keys_to_remove:
                i.metadata.pop(key, None)

            formatted_entry = (
                f"<Content>{i.text}</Content>\n"
                f"<Score>{i.score}</Score>\n"
                f"<Metadata>{i.metadata}</Metadata>\n"
                f"{'-' * 30}"
            )
            final_parts.append(formatted_entry)

        return "\n".join(final_parts)

    def reset_learnings(self):
        all_docs = []
        try:
            base_docs = SimpleDirectoryReader(
                input_dir=BASE_DIR, exclude=[".env"]
            ).load_data()
            all_docs.extend(base_docs)
        except ValueError:
            pass

        try:
            inside_docs = SimpleDirectoryReader(
                input_dir=BASE_DIR / "docs", exclude=[".env"]
            ).load_data()
            all_docs.extend(inside_docs)
        except ValueError:
            pass

        nodes = self.splitter.get_nodes_from_documents(all_docs)
        if self.should_reset:
            self.index.insert_nodes(nodes=nodes)
        return nodes

    def index_rules(self, rules: list):
        from llama_index.core.schema import TextNode

        nodes = []
        for rule in rules:
            nodes.append(
                TextNode(
                    text=rule.content,
                    metadata={
                        "rule_id": str(rule.task_id),
                        "type": rule.type,
                        "risk_level": rule.risk_level,
                        "source": rule.source_category,
                    },
                )
            )
        self.index.insert_nodes(nodes)
