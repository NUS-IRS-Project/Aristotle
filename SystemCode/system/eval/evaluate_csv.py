import ast

import pandas as pd
from langchain_ollama import ChatOllama, OllamaEmbeddings
from ragas import EvaluationDataset, RunConfig, evaluate
from ragas.metrics import (AnswerRelevancy, ContextPrecision, ContextRecall,
                           Faithfulness)

from aristotle import project_config

EVALUATION_SAMPLES = 10


def save_and_display_results(results_df: pd.DataFrame):
    print(f"[STEP] Saving results")
    results_df.to_csv(project_config.evaluation_metric_file, index=False)

    print("\n" + "=" * 60)
    print("EVALUATION RESULTS")
    print("=" * 60)
    print(f"Samples evaluated: {len(results_df)}")
    print("\nMetric Scores:")
    print("-" * 60)

    excluded_cols = [
        "sample_id",
        "user_input",
        "response",
        "reference",
        "retrieved_contexts",
        "metadata",
    ]

    for col in results_df.columns:
        if col not in excluded_cols:
            mean_score = results_df[col].mean()
            print(f"{col:<30} {mean_score:.4f}")

    print("=" * 60)


def evaluate_progress_file(results=None, file=None):
    print("[START] Reading evaluation csv...")

    print("[STEP] Initializing Ollama LLM for evaluation")
    ollama_llm = ChatOllama(model=project_config.ollama_llm_eval_model)

    print("[STEP] Initializing Ollama embeddings")
    ollama_embeddings = OllamaEmbeddings(model=project_config.ollama_embedding_model)

    if results:
        print("[STEP] Creating evaluation dataset")
        eval_dataset = EvaluationDataset.from_list(results[:EVALUATION_SAMPLES])
    else:
        df = pd.read_csv(file or project_config.evaluation_progress_file).iloc[
            :EVALUATION_SAMPLES
        ]

        print(f"\n[STEP] Evaluating {len(df)} samples with RAGAS")
        df["retrieved_contexts"] = df["retrieved_contexts"].apply(
            lambda x: ast.literal_eval(x) if isinstance(x, str) else x
        )
        print(df.dtypes)

        print("[STEP] Creating evaluation dataset")
        eval_dataset = EvaluationDataset.from_pandas(df)

    print("[STEP] Running evaluation with metrics")
    evaluation_results = evaluate(
        llm=ollama_llm,
        dataset=eval_dataset,
        embeddings=ollama_embeddings,
        metrics=[
            AnswerRelevancy(),
            Faithfulness(),
            ContextPrecision(),
            ContextRecall(),
        ],
        run_config=RunConfig(max_workers=1, max_retries=2, timeout=5 * 60),
    )

    results_df = evaluation_results.to_pandas()  # type: ignore
    results_df["ragas_score"] = results_df[
        ["AnswerRelevancy", "Faithfulness", "ContextPrecision", "ContextRecall"]
    ].mean(axis=1)
    results_df["metadata"] = df["metadata"]  # type: ignore
    save_and_display_results(results_df)

    print("\n[COMPLETE] Evaluation finished successfully")


if __name__ == "__main__":
    evaluate_progress_file(file="./eval/eval_progress_with_facts.csv")
