/** The welcome copy on the home page. */
export function IntroductoryText() {
  return (
    <div className="flex flex-col px-6 pt-8 sm:px-8 sm:pt-12 md:pt-16 lg:px-12 xl:px-20 max-w-2xl 3xl:max-w-3xl">
      <h1 className="mb-2 text-3xl sm:text-4xl md:text-5xl lg:text-6xl 3xl:text-7xl font-bold text-white tracking-tight">
        Welcome<span className="text-red-500">!</span>
      </h1>
      <div className="w-20 h-1 bg-linear-to-r from-red-500 to-transparent mb-8"></div>

      <p className="mb-6 text-base sm:text-lg md:text-xl font-light text-gray-100 leading-relaxed">This is my album review blog, where I share my thoughts on a variety of albums and artists.</p>

      <p className="mb-6 text-base sm:text-lg md:text-xl font-light text-gray-100 leading-relaxed">Whether it's a classic I missed or something brand new, every album I listen to ends up here.</p>

      <p className="mb-8 text-base sm:text-lg md:text-xl font-light text-gray-100">Thanks for visiting!</p>

      <div className="flex items-center gap-3">
        <div className="w-12 h-px bg-gray-500"></div>
        <p className="text-lg sm:text-xl md:text-2xl font-light text-gray-300 italic">James</p>
      </div>
    </div>
  );
}
