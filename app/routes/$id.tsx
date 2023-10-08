import type { MetaFunction, LoaderFunctionArgs } from "@remix-run/cloudflare";
import { useLoaderData } from "@remix-run/react";
import { json } from "@remix-run/cloudflare";
import type { WP_REST_API_Post } from "wp-types";
import { getAllPosts } from "~/lib/posts";
import KVStore from "~/lib/Store/KVStore";

export const meta: MetaFunction<typeof loader> = ({ data }) => {
  const post = data?.post as WP_REST_API_Post | undefined;
  return [{ title: post ? post.title.rendered : "not found" }];
};

export const loader = async ({ context, params }: LoaderFunctionArgs) => {
  const store = new KVStore((context.env as Env).POSTS);
  const posts = await getAllPosts((context.env as Env).WORDPRESS_URL, store);
  const post = posts.find((post: WP_REST_API_Post) => {
    return post.id === parseInt(params.id || "0", 10);
  });
  return json({ post });
};

export default function Index() {
  const data = useLoaderData<typeof loader>();
  const post = data?.post as WP_REST_API_Post | undefined;

  if (!post) {
    return (
      <div className="mx-auto w-full max-w-5xl format format-sm sm:format-base lg:format-lg format-blue dark:format-invert">
        <h1 className="mb-4 text-3xl font-extrabold leading-tight text-gray-900 lg:mb-6 lg:text-4xl dark:text-white">Not found.</h1>
      </div>
    );
  }

  return (
    <article className="mx-auto w-full max-w-5xl format format-sm sm:format-base lg:format-lg format-blue dark:format-invert">
      <h1 className="mb-4 text-3xl font-extrabold leading-tight text-gray-900 lg:mb-6 lg:text-4xl dark:text-white">
        {post.title.rendered}
      </h1>
      <div dangerouslySetInnerHTML={{ __html: post.content.rendered }} />
    </article>
  );
}
