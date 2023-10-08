import type { WP_REST_API_Posts } from "wp-types";
import type { Store } from "~/lib/Store/Store";
import pLimit from "p-limit";

const createPostsURL = (url: string, page: number, perPage: number) => {
  return `${url}/wp-json/wp/v2/posts/?_embed&page=${page}&per_page=${perPage}`;
};

export const fetchPosts = async (url: string): Promise<WP_REST_API_Posts> => {
  const limit = pLimit(4);
  const perPage = 100;
  let currentPage = 1;
  let posts: WP_REST_API_Posts = [];

  const request = new Request(createPostsURL(url, currentPage, perPage));
  const response = await fetch(request, {});
  const totalPages = Number(response.headers.get("X-WP-TotalPages"));
  const data = await response.json<WP_REST_API_Posts>();
  posts = posts.concat(data);

  let results: Promise<WP_REST_API_Posts>[] = [];
  for (let nextPage = 2; nextPage <= totalPages; nextPage++) {
    const nextRequest = new Request(createPostsURL(url, nextPage, perPage));
    const result = limit(async () => {
      console.log(`fetching ${nextRequest.url}`);
      const res = await fetch(nextRequest, {});
      const data = await res.json<WP_REST_API_Posts>();
      console.log(`fetched ${nextRequest.url}`);
      return data;
    });
    results = [...results, result];
  }

  const responses = await Promise.all(results);
  const paged = responses.flat();
  return [...posts, ...paged];
};

export const loadPostsToStore = async (WP_URL: string, store: Store) => {
  const posts = await getAllPosts(WP_URL, store);
  await store.set("posts", posts);
};

export const getAllPosts = async (
  WP_URL: string,
  store: Store | undefined,
): Promise<WP_REST_API_Posts> => {
  if (store) {
    const posts = await store.get<typeof fetchedPosts>("posts");
    if (posts) {
      return posts;
    }
  }

  const fetchedPosts = await fetchPosts(WP_URL);

  if (store) {
    await store.set("posts", fetchedPosts);
  }

  return fetchedPosts;
};
