"use client";
import React, { useEffect, useRef, useState } from "react";
import CollapseComponent from "./CollapseComponent";
import VideoSection from "./VideoSection";
import toast, { Toaster } from "react-hot-toast";
import { useSession } from "next-auth/react";
import agoraInstance from "@/lib/agora";
import { getRoom } from "@/lib/room";
import { RtmChannel } from "agora-rtm-sdk";
import { ICameraVideoTrack, IRemoteVideoTrack } from "agora-rtc-sdk-ng";
import { Room, User } from "@prisma/client";
import useWindowSize from "@/hooks/useWindowSize";
import Drawer from "@/Components/Common/Drawer/Drawer";
import { useSocket } from "@/app/context/socketContextStore";
import PageExitAlert from "@/Components/Common/Alert/PageExitAlert";
import { usePathname, useRouter } from "next/navigation";

export default function Main() {
  const [open, setIsOpen] = useState(true);
  const [openMobileChat, setOpenMobileChat] = useState(false);
  const [room, setRoom] = useState<Room>();
  const [messages, setMessages] = useState([]);
  const [themVideo, setThemVideo] = useState<IRemoteVideoTrack>();
  const [myVideo, setMyVideo] = useState<ICameraVideoTrack>();
  const [themUser, setThemUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [urlToRoute, setUrlToRoute] = useState<string>("");
  const { width } = useWindowSize();
  const { socket } = useSocket();

  const rtmChannelRef = useRef<RtmChannel | undefined>(undefined);

  const session = useSession();
  const userId = session.data?.user?.id;
  const router = useRouter();
  const pathname = usePathname();
  const originalPushRef = useRef(router.push);
  // const userId = (Math.random() * 1000).toString();


  useEffect(() => {
    socket?.on('connect', () => {
      console.log('Connected to server:', socket.id);
    });
    socket?.on('userJoined', (newUser: User) => {
      console.log('User joined:', newUser);
    });
    socket?.on('userDisconnected', (disconnectedUser: User) => {
      console.log('User disconnected:', disconnectedUser);
    });

    return () => {
      socket?.off('connect');
      socket?.off('userJoined');
      socket?.off('userDisconnected');
    };
  }, []);

  useEffect(() => {
    const handleBeforeUnload = (event: any) => {
      if (themUser) {
        event.preventDefault();
        event.returnValue = "You are in a chatting session, are you sure you want to leave?";
      }
    };

    const handleRouteChange = (url: string) => {
      if (url === pathname || !themUser) {
        return;
      }
      setUrlToRoute(url);
      (document.getElementById('alert_modal') as any).showModal();
      throw 'Route change aborted.';
    };

    window.addEventListener('beforeunload', handleBeforeUnload);

    const originalPush = router.push;
    const originalReplace = router.replace;

    router.push = (url, ...args) => {
      handleRouteChange(url);
      return originalPush(url, ...args);
    };

    router.replace = (url, ...args) => {
      handleRouteChange(url);
      return originalReplace(url, ...args);
    };
    
    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload);
      router.push = originalPush;
      router.replace = originalReplace;
    };
  }, [themUser, router]);

  const joinRoom = async () => {
    setIsLoading(true);
    setThemUser(null);
    setThemVideo(undefined);
    try {
      if (userId) {
        if(room?.id)  {
          await agoraInstance.leaveRoom(room.id); // leave room if already joined one
          socket?.emit('leaveRoom', room.id, userId);
        }
        const roomResult = await getRoom(room?.id); // get room
        if (!roomResult) return;
        setRoom(roomResult);

        const [rtcToken, rtmToken] = await Promise.all([
          agoraInstance.getRtcToken(roomResult.id, userId),
          agoraInstance.getRtmToken(userId)
        ]); // tokens

        [rtmChannelRef.current] = await Promise.all([
          agoraInstance.connectToAgoraRtm(userId, roomResult.id, rtmToken, setMessages), // RTM
          agoraInstance.connectToAgoraRtc( //RTC
            userId,
            roomResult.id,
            rtcToken,
            (themVideo: IRemoteVideoTrack) => setThemVideo(themVideo),
            (myVideo: ICameraVideoTrack) => setMyVideo(myVideo),
            (themUser: any) => setThemUser(themUser),
          )
        ]);
        socket?.emit('joinRoom', roomResult.id, userId);
      } else {
        toast.error("user not logged in properly, please re-login", {
          style: {
            background: '#333',
            color: '#fff',
          },
          id: 'room-join'
        });
      }
    } catch (e: any) {
      console.log("failure reason", e);
      toast.error("error joining room, please try again later", {
        style: {
          background: '#333',
          color: '#fff',
        },
        id: 'room-join'
      });
    } finally {
      setIsLoading(false);
    }
  }


  return (
    <>
      <Toaster />
      <PageExitAlert url={urlToRoute} openUrl={originalPushRef} />
      <div className={`relative ${width < 1000 ? 'overflow-y-hidden' : ''} flex gap-10 mx-auto max-w-[1400px] h-[86dvh] lg:h-[80dvh]`}>
        {width <= 1000 && <Drawer open={openMobileChat} setOpen={setOpenMobileChat} messages={messages} channel={rtmChannelRef} setMessages={setMessages} themUser={themUser} />}
        <div className={`transition-all duration-200 w-[100%]`}>
          <VideoSection isLoading={isLoading} setOpenMobileChat={setOpenMobileChat} getRoom={joinRoom} myVideo={myVideo} themVideo={themVideo} open={open} themUser={themUser} />
        </div>
        {width > 1000 && <CollapseComponent isLoading={isLoading} open={open} setIsOpen={setIsOpen} messages={messages} channel={rtmChannelRef} setMessages={setMessages} themUser={themUser} />}
      </div>
    </>
  );
}
