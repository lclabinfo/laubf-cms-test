function Frame() {
  return (
    <div className="content-stretch flex flex-col gap-[20px] items-center not-italic relative shrink-0 text-white">
      <p className="css-ew64yg font-['Helvetica_Neue:Medium',sans-serif] leading-none relative shrink-0 text-[40px] tracking-[-1.2px]">A Christian Ministry for College Students</p>
      <p className="css-4hzbpn font-['Inter:Regular',sans-serif] font-normal h-[84px] leading-[1.4] relative shrink-0 text-[20px] text-center tracking-[-0.6px] w-[960px]">University Bible Fellowship (UBF) is an international, non-denominational evangelical church centered on Bible study and discipleship. We especially serve college students, raising lifelong disciples of Jesus Christ who love one another and take part in God’s global mission.</p>
    </div>
  );
}

function Link() {
  return (
    <div className="bg-white content-stretch flex items-center px-[48px] py-[22px] relative rounded-[16777200px] shadow-[0px_20px_25px_-5px_rgba(0,0,0,0.2),0px_8px_10px_-6px_rgba(0,0,0,0.2)] shrink-0" data-name="Link">
      <p className="css-ew64yg font-['Inter:Bold',sans-serif] font-bold leading-[28px] not-italic relative shrink-0 text-[#0d0d0d] text-[20px] text-center tracking-[-0.4492px]">{`I'm New`}</p>
    </div>
  );
}

function Link1() {
  return (
    <div className="content-stretch flex items-center px-[40px] py-[22px] relative rounded-[16777200px] shrink-0" data-name="Link">
      <div aria-hidden="true" className="absolute border border-solid border-white inset-0 pointer-events-none rounded-[16777200px] shadow-[0px_20px_25px_-5px_rgba(0,0,0,0.2),0px_8px_10px_-6px_rgba(0,0,0,0.2)]" />
      <p className="css-ew64yg font-['Inter:Bold',sans-serif] font-bold leading-[28px] not-italic relative shrink-0 text-[20px] text-center text-white tracking-[-0.4492px]">About Us</p>
    </div>
  );
}

function Frame1() {
  return (
    <div className="content-stretch flex gap-[20px] items-start relative shrink-0">
      <Link />
      <Link1 />
    </div>
  );
}

export default function WhoWeAre() {
  return (
    <div className="bg-[#0d0d0d] content-stretch flex flex-col gap-[40px] items-center pb-[64px] pt-[80px] relative size-full" data-name="who-we-are">
      <Frame />
      <Frame1 />
    </div>
  );
}