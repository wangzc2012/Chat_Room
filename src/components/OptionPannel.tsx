import { compareObjects, deepClone } from "@/lib/client-utils";
import { defaultAudioSetting, presets } from "@/lib/const";
import { useObservableState } from "@/livekit-react-offical/hooks/internal";
import { denoiseMethod$ } from "@/lib/observe/DenoiseMethodObs";
import { DenoiseMethod, RoomMetadata } from "@/lib/types";
import { useMainBrowser } from "@/lib/hooks/useMainBrowser";
import { useCallback, useEffect, useMemo, useState } from "react";
import { useCurState } from "@/lib/hooks/useCurState";
import { useRoomInfo } from "@/lib/hooks/useRoomInfo";
import SettingIcon from "./Icons/SettingIcon";
import { useTranslation } from "react-i18next";
import { useWebAudioContext } from "@/lib/context/webAudioContex";
import { useKrispNoiseFilter } from '@livekit/components-react/krisp';
import { useDenoiseMethod } from "@/lib/hooks/useDenoise";
export function OptionPanel({showIcon,showText, ...props}: any) {
    const roominfo_after_enter = useRoomInfo()
    const denoiseSetting = useDenoiseMethod()
    const mcurState = useCurState()
    const [capacity, setCapacity] = useState("");
    const [isUseKrispDenoise, setIsUseKrispDenoise] = useState(false);
    const [localDenoiseConfig, setLocalDenoiseConfig] = useState<DenoiseMethod>( {...defaultAudioSetting.denoiseMethod});
    const isMainBrowser  = useMainBrowser()
    const { t, i18n } = useTranslation()
    const ctx = useWebAudioContext()
    const { isNoiseFilterEnabled, setNoiseFilterEnabled, isNoiseFilterPending } =  useKrispNoiseFilter();
    const [curShareVideoPrest, setCurShareVideoPrest]  = useState(presets[0])
    
    useEffect(() => {
        const s = localStorage.getItem('shareVideoPrest') || JSON.stringify(presets[0])
        setCurShareVideoPrest(JSON.parse(s || '{}'))
    }, [])
    
    useEffect(() => {
        setLocalDenoiseConfig(denoiseSetting)
        setIsUseKrispDenoise(denoiseSetting.krispNoiseDenoise)
    }, [denoiseSetting])

    const isnumber = (nubmer: string) => {
        const re = /^[1-9]\d*$/;//判断字符串是否为数字//判断正整数/[1−9]+[0−9]∗]∗/ 
        if (!re.test(nubmer)) {
            return false
        }
        return true
    }
    const isnumber2 = (nubmer: string) => {
        const re = /^[1-9]\d?$/;//判断字符串是否为数字//判断正整数/[1−9]+[0−9]∗]∗/ 
        if (!re.test(nubmer)) {
            return false
        }
        return true
    }
    const handleSubmit = (e: any) => {


        if (roominfo_after_enter.room_name == undefined && roominfo_after_enter.room_name == "") return
        updateRoomMeta(roominfo_after_enter.room_name).catch(e => {
            console.log(e)

        })
        if (capacity !== "" && !isnumber(capacity)) {
            alert("please type a number or leave it blank")
            e.preventDefault();
        }
        if (capacity !== "" && !isnumber2(capacity)) {
            alert("please type a number smaller than 100 or leave it blank")
            e.preventDefault();
        }

        //如果没有修改就不需要更新
        if(compareObjects(localDenoiseConfig,denoiseSetting)) return

        denoiseMethod$.next(deepClone(localDenoiseConfig))
        localStorage.setItem('denoiseMethod', JSON.stringify(localDenoiseConfig))
        localStorage.setItem('shareVideoPrest', JSON.stringify(curShareVideoPrest))
    }

    const buildVideoShareOptions = ()=>{
        return (
            <div className=" my-2 w-full grid grid-cols-3 gap-2 "   onChange={(v: any) => {
                console.log("update!~", v.target.value)
                for (let i = 0; i < presets.length; i++) {
                    if (presets[i].nickname === v.target.value) {
                        setCurShareVideoPrest(presets[i])
                        break
                    }
                }
            }}>
                {
                    presets.map(item=>
                        <div key={item.nickname} className="py-2 flex items-center text-center">
                            <input type="radio" value={item.nickname} name="123sadf" id={item.nickname} className="radio radio-success" checked={curShareVideoPrest?.nickname === item.nickname}
                            onChange={(v) => {
                                console.log(curShareVideoPrest?.nickname)
                            }}
                            ></input>
                            <label htmlFor={item.nickname} >{item.nickname}</label>
                        </div>
                    )
                }
            </div>
        )
    }

    const canUseKrisp = ()=>{
        // 只有livekit.cloud才能使用Krisp降噪
        return ((process.env.LIVEKIT_URL || "11")?.indexOf('livekit.cloud') > -1)
    }

    const updateRoomMeta = useCallback(
        async (roomName: string) => {
            const url = '/api/roomMetadata'
            if (roomName === undefined) return undefined
            if (!url) return undefined
            const body = {
                metadata: {
                    time: new Date().getTime(),
                    maxParticipants: Number(capacity)
                } as RoomMetadata,
                roomName: roomName
            };

            const response = await fetch(url, {
                method: "POST",
                headers: { "Content-Type": "application/json",
                    "authorization": mcurState.token?.accessToken ? 
                    ("Bearer " + mcurState.token?.accessToken) : ''
                 },
                body: JSON.stringify(body),
            });
            if (response.status === 200) {
                return await response.json();
            }

            const { error } = await response.json();
            throw error;
        },
        [roominfo_after_enter.room_name, capacity, mcurState]
    );

    return (
        <div className=" flex text-center justify-center items-center ">
            <label htmlFor="optionModel" className="btn  border-none btn-primary text-white gap-1">
                {
                    showIcon && 
                    <SettingIcon/>
                }
                {
                    showText && 
                    t('setting.setting')
                }
            </label>

            <input type="checkbox" id="optionModel" className="modal-toggle" />
            <div className="modal ">
                <div className="modal-box relative bg-primary form-control">
                    <label htmlFor="optionModel" className="btn btn-accent btn-sm btn-circle absolute right-2 top-2 ">✕</label>
                    {
                        mcurState.isAdmin &&
                        <div className="pl-4 pr-12 space-y-2">
                                <label className="label w-full cursor-pointer justify-between p-2">
                                    <span className="label-text text-white sm:text-lg">{t('setting.capacity')}</span>
                                    <input
                                        className=" w-[10rem] input-sm sm:input-md rounded-lg border-gray-200 bg-white p-3 text-gray-700 shadow-sm transition focus:border-white focus:outline-none focus:ring focus: ring-secondary-focus"
                                        id="capacity"
                                        name="capacity"
                                        type="text"
                                        placeholder={t('room.capacity')}
                                        onChange={(inputEl) => {
                                            setCapacity(inputEl.target.value)
                                        }}
                                        autoComplete="off"
                                    />
                                </label>
                        </div>
                    }

                    {
                        isMainBrowser && 
                        <div>
                        <div className=" divider mb-0"/>
                                <span className=" sm:text-xl font-bold">{t('setting.cssp')}</span>
                                {buildVideoShareOptions()}
                        </div>
                    }


                    {
                        isMainBrowser && 
                        <div>
                        <div className=" divider mb-0"/>
                                <span className=" sm:text-xl font-bold">{t('setting.cdm')}</span>
                                <div className=" my-2 w-full flex justify-around"   onChange={(v: any) => {
                                    if (localDenoiseConfig == null) return;
                                    // audiocontext中没有audioWorklet
                                    if(!ctx.audioWorklet) return;

                                    const new_config = { ...localDenoiseConfig };
                                    new_config.speex = false
                                    new_config.rnn = false
                                    if(v.target.value == 'speex'){
                                        new_config.speex = true
                                    }else if(v.target.value == 'rnn'){
                                        new_config.rnn = true
                                    }
                                    setLocalDenoiseConfig(new_config);
                                    // console.log(curShareVideoPrest)
                                    // console.log("update!~")
                                }}>
                                    <div className=" flex items-center gap-2 text-center">
                                        <input type="radio" value="none" name="denoiseMethod" id="denoiseMethod1" className="radio radio-success" checked={localDenoiseConfig ? localDenoiseConfig.speex == false &&  localDenoiseConfig.rnn == false : false}
                                        onChange={(v) => {}}
                                        ></input>
                                        <label htmlFor="denoiseMethod1" >None</label>
                                    </div>

                                    <div className=" flex items-center gap-2 text-center">
                                    <input type="radio" value="speex" name="denoiseMethod" id="denoiseMethod2" className="radio radio-success" checked={localDenoiseConfig ? localDenoiseConfig.speex : false}
                                     onChange={(v) => {}}
                                    ></input>
                                    <label htmlFor="denoiseMethod2" >Speex</label>
                                    </div>

                                    <div className=" flex items-center gap-2 text-center">
                                    <input type="radio" value="rnn"  name="denoiseMethod" id="denoiseMethod3" className="radio radio-success" checked={localDenoiseConfig ? localDenoiseConfig.rnn : false}
                                     onChange={(v) => {}}
                                    ></input>
                                    <label htmlFor="denoiseMethod3" >Rnn</label>
                                    </div>
                                </div>
                        </div>
                    }

                    <div className=" divider mb-0"/>
                    <div className="w-full flex justify-center space-x-2">
                        <div className="tooltip" data-tip={t('needCloud')}>
                                <div>KrispNoise</div>
                            </div>
                        <input type="checkbox"  checked={isUseKrispDenoise} disabled={isNoiseFilterPending || !canUseKrisp} className="checkbox" onChange={(v) => {
                            setIsUseKrispDenoise(v.target.checked)

                            const new_config = { ...localDenoiseConfig };
                            new_config.krispNoiseDenoise = v.target.checked
                            setLocalDenoiseConfig(new_config);
                        }} />
                    </div>
                        
                    <div className="mt-2 w-full flex justify-center">
                        <label htmlFor="optionModel" className="btn btn-md btn-secondary border-none mt-2" onClick={handleSubmit}>
                            {t('done')}
                        </label>
                    </div>
                </div>
            </div>

        </div>

    );
}