"use client";

import { useEffect, useState } from "react";
import MainContent from "../components/MainContent";

type ParamsProps = {
  params: { slug: string };
};

export default function Home({ params: { slug } }: ParamsProps) {
  const [name, setName] = useState<string>("");

  useEffect(() => {
    if (slug.startsWith("to%3A")) {
      const extractedName = decodeURIComponent(slug.slice(5)).replace(
        /%20/g,
        " "
      );
      setName(extractedName);
    }
  }, [slug]);

  return <MainContent name={name} />;
}
