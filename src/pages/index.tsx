import React, { use, useMemo } from 'react';
import Link from 'next/link'
import Typist from 'react-typist-component';
// import { HistoryCard } from '@/components/HistoryCard';
import { theme } from '@/lib/const';
import { withTranslation, WithTranslation } from "react-i18next"
import { RoomHistryType } from '@/lib/types';
class HomeComponent extends React.Component<WithTranslation> {
  state = {
    roomIdText: '',
    cursor: "|",
    isClient: false,
  };
  constructor(props: any) {
    super(props);
  }
  handleRoomIdTextChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    this.setState({ roomIdText: event.target.value });
  };

// timer = setInterval(()=>{
//     this.setState({cursor: this.state.cursor === "|" ? "*" : "|"})
// }, 300);

    componentDidMount() {
    // 仅在客户端执行
    this.setState({ isClient: true });
  }
  render() {
    const { t, i18n } = this.props;
    const roomHistory = this.state.isClient ? JSON.parse(localStorage.getItem('roomHistory') || '[]') : [];
    const isMobile = false
    return (
        <div className='Home flex flex-col justify-center space-y-4 items-center text-center mx-auto h-full w-full'>
            <div className='flex flex-col text-center justify-center'>
                {
                    i18n.language=='en' ?
                    (
                        <div>
                            <div className='text-xl md:text-5xl mb-2 hidden sm:block'>
                                A<Typist startDelay={1000}  typingDelay={110} loop={true}  cursor={<span className='cursor'>{this.state.cursor}</span>}   >nonymous Chat Room <Typist.Delay ms={1500} /><Typist.Backspace count={18} /></Typist>

                            </div>
                            <div className='text-xl md:text-5xl mb-2 block sm:hidden'>
                                Anonymous Chat Room
                            </div>
                        </div>
                    ) : (
                        <div className='text-xl md:text-5xl mb-2 block'>
                            欢迎来到匿名聊天室
                        </div>
                    )
                }
                <div className="mx-auto mt-8 max-w-xl sm:flex sm:gap-4 h-12">
                <input
                    placeholder= {t('room.roomName')}
                    value={this.state.roomIdText}
                    onChange={this.handleRoomIdTextChange}
                    className="w-48 rounded-lg border-gray-200 bg-white p-3 text-gray-700 shadow-sm transition focus:border-white focus:outline-none focus:ring focus: ring-secondary-focus"
                    style={{ marginRight: 10 }}
                    onKeyUp={(e) => {
                        if (e.key === 'Enter') {
                            if (this.state.roomIdText.length > 0) {
                                window.location.href = `/${this.state.roomIdText}`;
                            }
                        }
                    }}
                />
                <Link href={`/${this.state.roomIdText}`} > 
                    <button
                        className="btn font-bold btn-primary rounded-lg h-full w-fit border-none text-white"
                    >
                        👉 {t('Go')}
                    </button>
                </Link>
                </div>
            </div>
            {/* 访问过的房间历史列表 */}
           {
            roomHistory.length>0 &&
            <div className=' w-1/2'>
                <div className="divider">{t('history')}</div>
            </div>
           }
            <div className={`flex justify-center grid ${isMobile? 'grid-cols-2':'grid-cols-3'} `}>
                {roomHistory.map((item: RoomHistryType) => (
                    <Link key={item.roomName} href={`/${item.roomName}?passwd=${item.passwd}&username=${item.username}`}>
                        <div className="m-2 flex flex-col justify-center item-start space-y-2 bg-white/50 hover:bg-white/70 transition-colors duration-300 ease-in-out cursor-pointer 
                         rounded-lg p-2 hover:shadow-lg max-w-md">
                            <div className='flex space-x-2'>
                                <div className='text-right'>
                                    {t('room.roomName') + ': ' }
                                </div>
                                <div>
                                    {item.roomName}
                                </div>
                            </div>
                            <div className='flex space-x-2'>
                                <div className='text-right'>
                                    {t('username') + ': ' }
                                </div>
                                <div>
                                    {item.username}
                                </div>
                            </div>
                        </div>
                    </Link>
                ))}
            </div>

            <footer className='text-white gap-2 fixed bottom-0 text-xs sm:text-xl h-12 w-full py-1 px-2 flex items-center justify-center text-center bg-primary'>
                Hosted on 
                <a className=' text-accent-focus ' href="https://livekit.io/cloud?ref=meet" rel="noopener">
                LiveKit Cloud
                </a>
                . Source code on 
                <a className=' text-accent-focus ' href="https://github.com/velor2012/anonymous-chat-room" rel="noopener">
                GitHub
                </a>
                .
            </footer>
            {/* <div>
                <HistoryCard/>
            </div> */}
        </div>
    );
  }
}

export default withTranslation()(HomeComponent);