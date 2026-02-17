function Overlay() {
  return <div className="absolute h-[1080px] left-0 top-0 w-[1440px]" data-name="overlay" style={{ backgroundImage: "linear-gradient(195.581deg, rgba(0, 0, 0, 0) 32.92%, rgb(0, 0, 0) 94.163%)" }} />;
}

function Frame() {
  return (
    <div className="content-stretch flex font-['Helvetica_Neue:Medium',sans-serif] gap-[32px] items-end not-italic relative shrink-0 w-full">
      <div className="css-g0mm18 leading-[0.8] relative shrink-0 text-[0px] text-shadow-[0px_4px_6.9px_rgba(0,0,0,0.25)] text-white tracking-[-6.4px]">
        <p className="css-ew64yg mb-0 text-[80px]">Welcome to</p>
        <p className="css-ew64yg font-['DM_Serif_Text:Italic',sans-serif] italic text-[160px]">LA UBF</p>
      </div>
      <div className="leading-[0] relative shrink-0 text-[#ededed] text-[32px] tracking-[-1.28px] w-[483px]">
        <p className="css-4hzbpn mb-0">
          <span className="leading-[1.2] text-[#bebebe]">{`Where `}</span>
          <span className="leading-[1.2]">people find their community.</span>
        </p>
        <p className="css-4hzbpn mb-0">
          <span className="leading-[1.2] text-[#bebebe]">Where</span>
          <span className="leading-[1.2]">{` disciples are raised.`}</span>
        </p>
        <p className="css-4hzbpn">
          <span className="leading-[1.2] text-[#bebebe]">Where</span>
          <span className="leading-[1.2]">{` the Word of God is lived.`}</span>
        </p>
      </div>
    </div>
  );
}

function Link() {
  return (
    <div className="bg-white content-stretch flex items-center justify-center px-[32px] py-[16px] relative rounded-[16777200px] shadow-[0px_10px_15px_-3px_rgba(54,103,177,0.2),0px_4px_6px_-4px_rgba(54,103,177,0.2)] shrink-0" data-name="Link">
      <p className="css-ew64yg font-['Helvetica_Neue:Medium',sans-serif] leading-[24px] not-italic relative shrink-0 text-[20px] text-black tracking-[-0.3125px]">{`I'm New`}</p>
    </div>
  );
}

function Link1() {
  return (
    <div className="content-stretch flex items-center justify-center px-[33px] py-[17px] relative rounded-[16777200px] shrink-0" data-name="Link">
      <div aria-hidden="true" className="absolute border border-solid border-white inset-0 pointer-events-none rounded-[16777200px] shadow-[0px_10px_15px_-3px_rgba(54,103,177,0.2),0px_4px_6px_-4px_rgba(54,103,177,0.2)]" />
      <p className="css-ew64yg font-['Helvetica_Neue:Medium',sans-serif] leading-[24px] not-italic relative shrink-0 text-[20px] text-white tracking-[-0.3125px]">Upcoming Events</p>
    </div>
  );
}

function Frame1() {
  return (
    <div className="content-stretch flex gap-[16px] items-center relative shrink-0">
      <Link />
      <Link1 />
    </div>
  );
}

function Frame2() {
  return (
    <div className="absolute content-stretch flex flex-col gap-[48px] items-start left-[86px] top-[697px]">
      <Frame />
      <Frame1 />
    </div>
  );
}

export default function HeroV() {
  return (
    <div className="relative size-full" data-name="hero-v0">
      <video autoPlay className="absolute max-w-none object-cover size-full" controlsList="nodownload" loop playsInline>
        <source src="/_videos/v1/8983de7586e710b5ab851aa7bd79eee9db591efc" />
      </video>
      <Overlay />
      <Frame2 />
    </div>
  );
}