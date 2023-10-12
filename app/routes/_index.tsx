import type { MetaFunction, LoaderFunctionArgs } from "@remix-run/cloudflare";

import { Link, useLoaderData } from "@remix-run/react";
import { json } from "@remix-run/cloudflare";
import type { WP_REST_API_Post, WP_REST_API_Posts } from "wp-types";
import { loadAllPosts } from '~/lib/loader';

export const meta: MetaFunction = () => {
  return [{ title: "Blog Posts From WP" }];
};

export const loader = async ({ context }: LoaderFunctionArgs) => {
  const WORDPRESS_URL = (context.env as Env).WORDPRESS_URL;
  const waitUntil = context.waitUntil as (promise: Promise<any>) => void
  const POSTS = (context.env as Env).POSTS;
  const posts = await loadAllPosts( WORDPRESS_URL,  POSTS, waitUntil);
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
