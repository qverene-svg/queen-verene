"use client";
import { useEffect, useState } from "react";
import { Camera as Instagram } from "lucide-react";
import { motion } from "framer-motion";

interface IGPost {
  id: string;
  media_url: string;
  permalink: string;
  caption?: string;
  media_type: string;
}

// Fallback placeholder images when Instagram API is not yet configured
const placeholderPosts = Array.from({ length: 6 }, (_, i) => ({
  id: String(i),
  media_url: `https://images.unsplash.com/photo-${
    [
      "1560066984-138dadb4c035",
      "1522337360788-8b13dee7a37e",
      "1487412947147-5cebf100ffc2",
      "1604654894610-df63bc536371",
      "1519415510236-818bdfcd6d3a",
      "1622287162716-f311baa1a2b8",
    ][i]
  }?w=400&q=80`,
  permalink: "https://instagram.com",
  media_type: "IMAGE",
}));

export function InstagramFeed() {
  const [posts, setPosts] = useState<IGPost[]>(placeholderPosts);

  useEffect(() => {
    const token = process.env.NEXT_PUBLIC_INSTAGRAM_ACCESS_TOKEN;
    if (!token || token === "your_instagram_access_token") return;
    fetch(
      `https://graph.instagram.com/me/media?fields=id,media_url,permalink,caption,media_type&access_token=${token}&limit=6`
    )
      .then((r) => r.json())
      .then((data) => { if (data.data) setPosts(data.data); })
      .catch(() => {});
  }, []);

  return (
    <section className="py-24 px-6 bg-[#0a0a0a]">
      <div className="max-w-7xl mx-auto">
        <div className="text-center mb-12">
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="inline-flex items-center gap-2 text-[#d4af37] mb-4"
          >
            <Instagram size={20} />
            <span className="text-xs font-semibold tracking-[0.3em] uppercase">Follow Our Journey</span>
          </motion.div>
          <motion.h2
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.1 }}
            className="font-[Playfair_Display] text-4xl text-white"
          >
            @verene.beauty
          </motion.h2>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2">
          {posts.map((post, i) => (
            <motion.a
              key={post.id}
              href={post.permalink}
              target="_blank"
              rel="noopener noreferrer"
              initial={{ opacity: 0, scale: 0.95 }}
              whileInView={{ opacity: 1, scale: 1 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.07 }}
              className="relative group aspect-square overflow-hidden rounded-xl block"
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={post.media_url}
                alt={post.caption || "Verene beauty post"}
                className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
              />
              <div className="absolute inset-0 bg-black/0 group-hover:bg-black/40 transition-all flex items-center justify-center">
                <Instagram size={24} className="text-white opacity-0 group-hover:opacity-100 transition-opacity" />
              </div>
            </motion.a>
          ))}
        </div>

        <div className="text-center mt-8">
          <a
            href="https://instagram.com/verene.beauty"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 text-sm text-white/50 hover:text-[#d4af37] transition-colors font-semibold tracking-widest uppercase"
          >
            <Instagram size={16} />
            Follow on Instagram
          </a>
        </div>
      </div>
    </section>
  );
}
