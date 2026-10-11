export type TopicVisibility = { slug: string; active?: boolean };

export function topicIsActive(slug: string, topics: Map<string, TopicVisibility>) {
  const topic = topics.get(slug);
  return !!topic && topic.active !== false;
}

export function activeTopicArticles<T extends { topicSlug: string }>(articles: T[], topics: Map<string, TopicVisibility>) {
  return articles.filter((article) => topicIsActive(article.topicSlug, topics));
}
