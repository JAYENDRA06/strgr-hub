import useWindowSize from "@/hooks/useWindowSize";
import {
    BsCameraVideoFill,
    BsCameraVideoOffFill,
    BsExclamationTriangleFill,
    BsFastForwardCircleFill,
    BsMicFill,
    BsMicMuteFill,
    BsPersonFillAdd,
    BsPersonHearts,
} from "react-icons/bs";
import { FaComments } from 'react-icons/fa';

export default function ActionButtons({ 
  isLoading, 
  setOpenMobileChat,
  getRoom, 
  trackState,
  mute, 
  addFriend, 
  themUser, 
  requestLoading, 
  reporting 
}: any) {
  const {width} = useWindowSize();
  return (
    <div className="flex flex-wrap gap-3 mt-5 order-3">
        <button className={`flex gap-2 btn ${isLoading ? "btn-disabled" : "btn-primary"}`} onClick={getRoom} disabled={isLoading}>
          <p>SKIP</p>
          <BsFastForwardCircleFill size={20} />
        </button>
        {setOpenMobileChat && <ActionButton
          icon={themUser ? <FaComments size={20} /> : <BsPersonHearts size={20} />}
          func={setOpenMobileChat}
          tooltipData={width > 1000 ? "open chat" : null}
        />}
        {false && <><ActionButton
          icon={
            trackState.video ? (
              <BsCameraVideoFill size={20} />
            ) : (
              <BsCameraVideoOffFill size={20} />
            )
          }
          func={() => mute("video")}
          tooltipData={width > 1000 ? "open/close camera" : null}
        />
        <ActionButton
          icon={
            trackState.audio ? (
              <BsMicFill size={20} />
            ) : (
              <BsMicMuteFill size={20} />
            )
          }
          func={() => mute("audio")}
          tooltipData={width > 1000 ? "open/close mic" : null}
        /></>}
        {themUser && <><ActionButton
          icon={<BsPersonFillAdd size={20} />}
          func={addFriend}
          tooltipData={width > 1000 ? "add friend" : null}
          disabled={isLoading || requestLoading}
        />
        <ActionButton
          icon={<BsExclamationTriangleFill size={20} />}
          func={() => (document.getElementById('report_modal') as any)?.showModal()}
          tooltipData={width > 1000 ? "report" : null}
          disabled={isLoading || reporting}
        /></>}
    </div>
  );
}

function ActionButton({ icon, func, tooltipData, disabled }: any) {
  return (
    <div
      className="tooltip tooltip-bottom tooltip-secondary"
      data-tip={tooltipData}
    >
      <button
        className={`h-[50px] w-[50px] flex justify-center items-center rounded-full border border-base-200 hover:border-primary btn ${
          disabled ? "btn-disabled" : "btn-secondary"
        } p-0`}
        onClick={func}
        disabled={disabled}
      >
        {icon}
      </button>
    </div>
  );
}