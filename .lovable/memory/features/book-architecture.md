Architecture: question→chapter mapping, raw text storage, future book generation from structured chapters

## Data Flow
1. Each question is pre-mapped to a chapter (no AI classification needed)
2. User answers are saved as-is (raw text, no embellishment)
3. Voice answers: transcribe → save raw text + voice file
4. Entries table has `chapter` column for automatic categorization
5. Voice recordings saved for future voice synthesis

## Chapters (in book order)
childhood, family, relationships, career, daily_life, travel, dreams, values, gratitude, wisdom, memories, reflections

## Question Pool
~1000 questions (~84 per chapter), each with ru/en translations, defined in src/lib/questions.ts

## Future: Book Generation
- Entries grouped by chapter in predefined order
- Raw user words preserved
- AI only used for transcription, NOT for rewriting
