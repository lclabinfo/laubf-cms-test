function Frame1() {
  return <div className="absolute bg-[#dedede] h-[732px] left-[92px] rounded-[43px] top-[93px] w-[423px]" />;
}

function Frame2() {
  return <div className="absolute bg-[#b5b5b5] left-[594px] rounded-[43px] size-[160px] top-[200px]" />;
}

function Frame3() {
  return <div className="absolute bg-[#b5b5b5] left-[787px] rounded-[43px] size-[160px] top-[200px]" />;
}

function Frame4() {
  return <div className="absolute bg-[#b5b5b5] left-[980px] rounded-[43px] size-[160px] top-[200px]" />;
}

function Frame5() {
  return <div className="absolute bg-[#b5b5b5] left-[1173px] rounded-[43px] size-[160px] top-[200px]" />;
}

function Frame6() {
  return <div className="absolute bg-[#dedede] h-[48px] left-[594px] top-[110px] w-[866px]" />;
}

function Frame7() {
  return <div className="absolute bg-[#dedede] h-[48px] left-[1500px] top-[110px] w-[141px]" />;
}

export default function Frame() {
  return (
    <div className="bg-white relative size-full">
      <Frame1 />
      <Frame2 />
      <Frame3 />
      <Frame4 />
      <Frame5 />
      <Frame6 />
      <Frame7 />
    </div>
  );
}