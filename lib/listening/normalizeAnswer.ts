export function normalizeAnswer(value: string): string {
  return value.normalize("NFKC").toLocaleLowerCase().replace(/[\s\u200b]+/g, "").replace(/[.,!?。！？、，；：:;"'“”‘’()[\]{}<>《》·…—–-]/g, "");
}
