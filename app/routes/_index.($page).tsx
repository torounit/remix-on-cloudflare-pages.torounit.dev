import type { MetaFunction, LoaderFunctionArgs } from "@remix-run/cloudflare";

import { Link, useLoaderData } from "@remix-run/react";
import { json } from "@remix-run/cloudflare";
import type { WP_REST_API_Post, WP_REST_API_Posts } from "wp-types";
import { loadAllPosts } from '~/lib/loader';

const POSTS_PER_PAGE = 100;

export const meta: MetaFunction = () => {
  return [{ title: "Blog Posts From WP" }];
};

export const loader = async ({ context, params }: LoaderFunctionArgs) => {
  const page = parseInt(params?.page || "1", 10);
  const WORDPRESS_URL = (context.env as Env).WORDPRESS_URL;
  const waitUntil = context.waitUntil as (promise: Promise<any>) => void
  const POSTS = (context.env as Env).POSTS;
  const posts = await loadAllPosts( WORDPRESS_URL,  POSTS, waitUntil);
  if (posts.length < ( page - 1 ) * POSTS_PER_PAGE ) {
    throw new Response(null, {
      status: 404,
      statusText: "Not Found",
    });
  }

  return json({
    posts: posts.slice( (page - 1) * POSTS_PER_PAGE, page * POSTS_PER_PAGE ),
    page,
    totalPages: Math.ceil(posts.length / POSTS_PER_PAGE),
  });
};

export default function Index() {
  const data = useLoaderData<typeof loader>();
  const posts = data?.posts as WP_REST_API_Posts | undefined;
  return (
    <div>


      <h1 className="mb-12 text-xl font-bold">Posts</h1>
      {posts ? (
        <div>
          <ul>
            {posts.map((post: WP_REST_API_Post) => (
              <li
                key={post.id}
                className="mb-8 text-2xl font-extrabold leading-tight text-gray-900 lg:mb-12 dark:text-white"
              >
                <Link to={`/posts/${post.id}`}>{post.title.rendered}</Link>
              </li>
            ))}
          </ul>
          <div>
            {[...Array(data.totalPages || 1)].map((_, i) => i + 1).map((page) => (
              <Link
                key={page}
                to={`/${page}`}
                className={`mr-4 ${ page === data?.page ? "text-black" : "text-blue-500" }`}
              >{page}</Link>
            ))}
          </div>
        </div>

      ) : (
        <div>Nothing.</div>
      )}
    </div>
  );
}
