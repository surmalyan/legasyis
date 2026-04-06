const BackgroundPattern = () => (
  <div className="pointer-events-none fixed inset-0 overflow-hidden opacity-[0.045] dark:opacity-[0.03]" aria-hidden="true">
    {/* Infinity symbols */}
    <svg className="absolute top-[8%] left-[5%] w-32 h-16 text-foreground" viewBox="0 0 200 100" fill="none">
      <path d="M50 50 C50 20,90 20,100 50 C110 80,150 80,150 50 C150 20,110 20,100 50 C90 80,50 80,50 50Z" stroke="currentColor" strokeWidth="2" />
    </svg>
    <svg className="absolute top-[35%] right-[8%] w-24 h-12 text-foreground rotate-12" viewBox="0 0 200 100" fill="none">
      <path d="M50 50 C50 20,90 20,100 50 C110 80,150 80,150 50 C150 20,110 20,100 50 C90 80,50 80,50 50Z" stroke="currentColor" strokeWidth="2" />
    </svg>
    <svg className="absolute bottom-[15%] left-[12%] w-20 h-10 text-foreground -rotate-6" viewBox="0 0 200 100" fill="none">
      <path d="M50 50 C50 20,90 20,100 50 C110 80,150 80,150 50 C150 20,110 20,100 50 C90 80,50 80,50 50Z" stroke="currentColor" strokeWidth="2" />
    </svg>

    {/* Tree of life / DNA sprout */}
    <svg className="absolute top-[18%] right-[15%] w-20 h-28 text-foreground" viewBox="0 0 60 90" fill="none">
      <path d="M30 85 L30 40" stroke="currentColor" strokeWidth="1.5" />
      <path d="M30 40 C20 30,15 15,30 5 C45 15,40 30,30 40Z" stroke="currentColor" strokeWidth="1.5" />
      <path d="M30 60 C22 55,18 45,25 38" stroke="currentColor" strokeWidth="1" />
      <path d="M30 60 C38 55,42 45,35 38" stroke="currentColor" strokeWidth="1" />
      <path d="M30 85 C25 80,22 75,26 70" stroke="currentColor" strokeWidth="1" />
      <path d="M30 85 C35 80,38 75,34 70" stroke="currentColor" strokeWidth="1" />
    </svg>
    <svg className="absolute bottom-[25%] right-[5%] w-16 h-24 text-foreground rotate-12" viewBox="0 0 60 90" fill="none">
      <path d="M30 85 L30 40" stroke="currentColor" strokeWidth="1.5" />
      <path d="M30 40 C20 30,15 15,30 5 C45 15,40 30,30 40Z" stroke="currentColor" strokeWidth="1.5" />
      <path d="M30 60 C22 55,18 45,25 38" stroke="currentColor" strokeWidth="1" />
      <path d="M30 60 C38 55,42 45,35 38" stroke="currentColor" strokeWidth="1" />
    </svg>

    {/* DNA helix hints */}
    <svg className="absolute top-[55%] left-[3%] w-14 h-32 text-foreground" viewBox="0 0 40 100" fill="none">
      <path d="M10 10 C25 20,25 30,10 40 C-5 50,-5 60,10 70 C25 80,25 90,10 100" stroke="currentColor" strokeWidth="1.2" />
      <path d="M30 10 C15 20,15 30,30 40 C45 50,45 60,30 70 C15 80,15 90,30 100" stroke="currentColor" strokeWidth="1.2" />
    </svg>

    {/* Scattered leaves */}
    <svg className="absolute top-[70%] left-[40%] w-10 h-10 text-foreground rotate-45" viewBox="0 0 40 40" fill="none">
      <path d="M20 35 C10 25,5 10,20 2 C35 10,30 25,20 35Z" stroke="currentColor" strokeWidth="1.2" />
      <path d="M20 35 L20 18" stroke="currentColor" strokeWidth="1" />
    </svg>
    <svg className="absolute top-[5%] left-[50%] w-8 h-8 text-foreground -rotate-20" viewBox="0 0 40 40" fill="none">
      <path d="M20 35 C10 25,5 10,20 2 C35 10,30 25,20 35Z" stroke="currentColor" strokeWidth="1.2" />
      <path d="M20 35 L20 18" stroke="currentColor" strokeWidth="1" />
    </svg>
    <svg className="absolute bottom-[8%] right-[30%] w-12 h-12 text-foreground rotate-[160deg]" viewBox="0 0 40 40" fill="none">
      <path d="M20 35 C10 25,5 10,20 2 C35 10,30 25,20 35Z" stroke="currentColor" strokeWidth="1.2" />
      <path d="M20 35 L20 18" stroke="currentColor" strokeWidth="1" />
    </svg>
  </div>
);

export default BackgroundPattern;
