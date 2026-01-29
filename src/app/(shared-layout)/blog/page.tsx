import { buttonVariants } from "@/components/ui/button";
import Link from "next/link";

const BlogPage = () => {
  return (
    <div className="border border-purple-500 py-12">
      <Link
        className={buttonVariants({ variant: "default" })}
        href="/create-blog"
      >
        Create
      </Link>
    </div>
  );
};

export default BlogPage;
