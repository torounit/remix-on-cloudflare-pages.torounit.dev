import type { MetaFunction, LoaderFunctionArgs } from "@remix-run/cloudflare";

import { Link, useLoaderData } from "@remix-run/react";
import { json } from "@remix-run/cloudflare";
import type { WP_REST_API_Post, WP_REST_API_Posts } from "wp-types";
import { fetchPosts } from "~/lib/posts";
import KVStore from "~/lib/Store/KVStore";
import { STALE_TTL, TTL } from '~/config';

export const meta: MetaFunction = () => {
  return [{ title: "Blog Posts From WP" }];
};

export const loader = async ({ context }: LoaderFunctionArgs) => {
  let posts: WP_REST_API_Posts = [];
  const WORDPRESS_URL = (context.env as Env).WORDPRESS_URL;
  const waitUntil =  context.waitUntil as (promise: Promise<any>) => void
  const POSTS = (context.env as Env).POSTS;

  const FreshPostsStore = new KVStore<WP_REST_API_Posts>(POSTS,
    "FreshPosts",
    { expirationTtl: TTL });
  const freshPosts = await FreshPostsStore.get();

  if (freshPosts) {
    console.log('found.');
    return json({ posts: freshPosts });
  }

  const StalePostsStore = new KVStore<WP_REST_API_Posts>(POSTS,
    "StalePosts",
    { expirationTtl: STALE_TTL });
  const stalePosts = await StalePostsStore.get();

  if (stalePosts) {
    console.log('stale found.');
    posts = stalePosts;
    waitUntil((async () => {
      const fetchedPosts = await fetchPosts(WORDPRESS_URL);
      await FreshPostsStore.set(fetchedPosts);
      await StalePostsStore.set(fetchedPosts);
      return fetchedPosts;
    })());
  } else {
    console.log('fetched.');
    posts = await fetchPosts(WORDPRESS_URL);
    await FreshPostsStore.set(posts);
    await StalePostsStore.set(posts);
  }

  return json({ posts });
};

export default function Index() {
  const data = useLoaderData<typeof loader>();
  const posts = data?.posts as WP_REST_API_Posts | undefined;
  return (
    <div>
      <h1 className="mb-12 text-xl font-bold">Posts</h1>
      {posts ? (
        <ul>
          {posts.map((post: WP_REST_API_Post) => (
            <li
              key={post.id}
              className="mb-8 text-2xl font-extrabold leading-tight text-gray-900 lg:mb-12 dark:text-white"
            >
              <Link to={`/${post.id}`}>{post.title.rendered}</Link>
            </li>
          ))}
        </ul>
      ) : (
        <div>Nothing.</div>
      )}
    </div>
  );
}
