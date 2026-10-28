import { lazy, Suspense } from "react";
const Studio = lazy(() =>
  import("@/pages/Studio").then((m) => ({ default: m.Studio })),
);
import { Stories } from "@/pages/Stories";
import { RouterProvider, useRouter } from "@/router";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { Home } from "@/pages/Home";
import { About } from "@/pages/About";
import { StoryHub } from "@/pages/StoryHub";
import { StoryChapter } from "@/pages/StoryChapter";
import { Work } from "@/pages/Work";
import { Contact } from "@/pages/Contact";
import { CinematicIntro } from "@/components/CinematicIntro";
import { Blog } from "@/pages/Blog";
import { BlogPost } from "@/pages/BlogPost";
import { NotifyPopup } from "@/components/NotifyPopup";
import { LanguageProvider } from "@/context/LanguageContext";
function Routes() {
  const { route } = useRouter();
  const path = route.path;

  if (path === "/admin")
    return (
      <Suspense
        fallback={
          <div className="min-h-screen flex items-center justify-center">
            Opening Studio…
          </div>
        }
      >
        <Studio />
      </Suspense>
    );
  let page;
  if (path === "/") page = <Home />;
  else if (path === "/stories") page = <Stories />;
  else if (path.startsWith("/stories/"))
    page = <Stories slug={path.split("/").pop() || ""} />;
  else if (path === "/about") page = <About />;
  else if (path === "/blog") page = <Blog />;
  else if (path === "/story") page = <StoryHub />;
  else if (path.startsWith("/story/"))
    page = <StoryChapter slug={path.split("/").pop() || ""} />;
  else if (path === "/work") page = <Work />;
  else if (path.startsWith("/blog/"))
    page = <BlogPost slug={path.split("/").pop() || ""} />;
  else if (path === "/contact") page = <Contact />;
  else page = <Home />; // fallback — could be a 404 but Home is safe for a personal site

  return (
    <div className="min-h-screen flex flex-col bg-bg">
      <CinematicIntro />
      <Navbar />
      <main className="flex-1">{page}</main>
      <Footer />
      <NotifyPopup />
    </div>
  );
}

function App() {
  return (
    <LanguageProvider>
      <RouterProvider>
        <Routes />
      </RouterProvider>
    </LanguageProvider>
  );
}

export default App;
