export const EMBEDDING_MODEL = 'google/gemini-embedding-2';
export const EMBEDDING_DIMENSIONS = 3072;
export function validVector(vector: unknown): vector is number[] {
  return Array.isArray(vector) && vector.length === EMBEDDING_DIMENSIONS && vector.every(n => typeof n === 'number' && Number.isFinite(n));
}
export function validObservations(value: unknown): value is string {
  return typeof value === 'string' && value.length <= 2000;
}
export function diseaseContent(disease: { name: string; description: string; symptoms: string[] }) {
  return `${disease.name}\n${disease.description}\nSymptoms: ${disease.symptoms.map(s => s.replace(/_/g, ' ')).join(', ')}`;
}