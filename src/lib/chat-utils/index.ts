export const encoder = (str: string, type: 'text' | 'img') => {
    return `[${type}](${str})[/${type}]`
  };

export const decoder = (str: string) => {
  const regex = /\[(text|img)\]\(([\s\S]*?)\)\[\/\1\]/;
  const match = str.match(regex);
  if (match) {
    return {
      type: match[1] as 'text' | 'img',
      content: match[2]
    };
  }
  return null;
};