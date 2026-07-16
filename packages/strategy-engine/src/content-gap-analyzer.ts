import type { ContentGap, StrategyContext } from "./types.ts";

const recommendedThemes = ["culpa", "esperanca", "reconquista", "desejo", "silencio", "reencontro"];
const recommendedFormats = ["reel", "carousel", "story"] as const;

export function analyzeContentGaps(context: StrategyContext): ContentGap[] {
  const gaps: ContentGap[] = [];
  const topThemes = context.learning.analysis.top_themes;
  const totalThemeUses = topThemes.reduce((sum, item) => sum + item.count, 0);
  const dominantTheme = topThemes[0];
  const usedThemeNames = new Set(topThemes.map((item) => item.name));
  const usedFormats = new Set(context.learning.analysis.score_by_format.map((item) => item.name));

  if (dominantTheme && totalThemeUses > 0 && dominantTheme.count / totalThemeUses >= 0.7) {
    gaps.push({
      type: "concentration",
      message: `O tema ${dominantTheme.name} concentra ${Math.round((dominantTheme.count / totalThemeUses) * 100)}% das execucoes.`,
      suggestion: "Introduza temas adjacentes para evitar saturacao criativa."
    });
  }

  for (const theme of recommendedThemes) {
    if (!usedThemeNames.has(theme)) {
      gaps.push({
        type: "missing_theme",
        message: `O tema ${theme} ainda nao foi explorado no historico recente.`,
        suggestion: `Teste ${theme} como variacao emocional nos proximos conteudos.`
      });
    }
  }

  for (const format of recommendedFormats) {
    if (!usedFormats.has(format)) {
      gaps.push({
        type: "missing_format",
        message: `O formato ${format} ainda nao aparece no historico analisado.`,
        suggestion: `Inclua ${format} em pelo menos uma publicacao do plano.`
      });
    }
  }

  return gaps.slice(0, 8);
}
