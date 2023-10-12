import type { MetaFunction, LoaderFunctionArgs } from "@remix-run/cloudflare";
import { useLoaderData } from "@remix-run/react";
import { json } from "@remix-run/cloudflare";
import type { WP_REST_API_Post , WP_REST_API_Posts } from "wp-types";
import { loadAllPosts } from '~/lib/loader';

export const meta: MetaFunction<typeof loader> = ({ data }) => {
  const post = data?.post as WP_REST_API_Post | undefined;
  return [{ title: post ? post.title.rendered : "not found" }];
};

const pickPost = (posts: WP_REST_API_Posts, id: number) => {
  return posts.find((post: WP_REST_API_Post) => {
    return post.id === id;
  });
}

export const loader = async ({ context, params }: LoaderFunctionArgs) => {
  const postId = parseInt(params.id || "0", 10);
  const WORDPRESS_URL = (context.env as Env).WORDPRESS_URL;
  const waitUntil = context.waitUntil as (promise: Promise<any>) => void
  const POSTS = (context.env as Env).POSTS;
  const posts = await loadAllPosts( WORDPRESS_URL,  POSTS, waitUntil);
  return json({ post: pickPost(posts, postId) });
};

export default function Index() {
  const data = useLoaderData<typeof loader>();
  const post = data?.post as WP_REST_API_Post | undefined;

  if (!post) {
    return (
      <div className="mx-auto w-full max-w-5xl format format-sm sm:format-base lg:format-lg format-blue dark:format-invert">
        <h1 className="mb-4 text-3xl font-extrabold leading-tight text-gray-900 lg:mb-6 lg:text-4xl dark:text-white">Not
          found.</h1>
      </div>
    );
  }

  return (
    <article className="mx-auto w-full max-w-5xl format format-sm sm:format-base lg:format-lg format-blue dark:format-invert">
      <h1 className="mb-4 text-3xl font-extrabold leading-tight text-gray-900 lg:mb-6 lg:text-4xl dark:text-white">
        {post.title.rendered}
      </h1>
      <div dangerouslySetInnerHTML={{ __html: post.content.rendered }}/>
    </article>
  );
}
