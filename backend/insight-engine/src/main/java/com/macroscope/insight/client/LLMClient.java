package com.macroscope.insight.client;

import com.macroscope.insight.model.InsightPrompt;
import com.macroscope.insight.model.LLMInsightDraft;

import java.util.Optional;

public interface LLMClient {

    Optional<LLMInsightDraft> generateInsight(InsightPrompt prompt);
}
