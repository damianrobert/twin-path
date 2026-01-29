import { Footprints } from "lucide-react";
import Link from "next/link";

const Logo = () => {
  return (
    <div className="flex items-center gap-1 mx-2">
      <Link href="/">
        <h1 className="text-2xl font-bold">
          Twin<span className="text-purple-600">Path</span>
        </h1>
      </Link>
      <Footprints />
    </div>
  );
};

export default Logo;
