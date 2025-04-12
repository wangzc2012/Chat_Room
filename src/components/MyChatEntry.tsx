import { decoder } from '@/lib/chat-utils';
import type { ReceivedChatMessage } from '@livekit/components-core';
import { tokenize, createDefaultGrammar } from '@livekit/components-core';
import * as React from 'react';
import 'react-alert-confirm/lib/style.css';
import AlertConfirm from "react-alert-confirm";

/** @public */
export type MessageFormatter = (message: string) => React.ReactNode;

/**
 * ChatEntry composes the HTML div element under the hood, so you can pass all its props.
 * These are the props specific to the ChatEntry component:
 * @public
 */
export interface ChatEntryProps extends React.HTMLAttributes<HTMLLIElement> {
  /** The chat massage object to display. */
  entry: ReceivedChatMessage;
  lastEntry: ReceivedChatMessage;
  /** Hide sender name. Useful when displaying multiple consecutive chat messages from the same person. */
  hideName?: boolean;
  /** Hide message timestamp. */
  hideTimestamp?: boolean;
  /** An optional formatter for the message body. */
  messageFormatter?: MessageFormatter;
}

/**
 * The `ChatEntry` component holds and displays one chat message.
 *
 * @example
 * ```tsx
 * <Chat>
 *   <ChatEntry />
 * </Chat>
 * ```
 * @see `Chat`
 * @public
 */
export const ChatEntry: (
  props: ChatEntryProps & React.RefAttributes<HTMLLIElement>,
) => React.ReactNode = /* @__PURE__ */ React.forwardRef<HTMLLIElement, ChatEntryProps>(
  function ChatEntry(
    { entry, lastEntry,  hideName = false, hideTimestamp = false, messageFormatter, ...props }: ChatEntryProps,
    ref,
  ) {
    const formattedMessage = React.useMemo(() => {
      return messageFormatter ? messageFormatter(entry.message) : entry.message;
    }, [entry.message, messageFormatter]);
    const hasBeenEdited = !!entry.editTimestamp;
    const time = new Date(entry.timestamp);
    const locale = typeof navigator !== 'undefined' ? navigator.language : 'en-US';

    const name = entry.from?.name ?? entry.from?.identity;
    const lastName = lastEntry?.from?.name ?? lastEntry?.from?.identity;
    const entityType = decoder(entry.message || "")?.type || 'text';   

    return (
      <li
        ref={ref}
        className='lk-chat-entry'
        title={time.toLocaleTimeString(locale, { timeStyle: 'full' })}
        data-lk-message-origin={entry.from?.isLocal ? 'local' : 'remote'}
        {...props}
      >
        {/* {(!hideTimestamp || !hideName || hasBeenEdited) && (
          <span className="lk-meta-data">
            {!hideName && <strong className="lk-participant-name">{name}</strong>}

            {(!hideTimestamp || hasBeenEdited) && (
              <span className="lk-timestamp">
                {hasBeenEdited && 'edited '}
                {time.toLocaleTimeString(locale, { timeStyle: 'short' })}
              </span>
            )}
          </span>
        )} */}

        <div className={`lk-message-body ${entry.from?.isLocal ? 'ml-auto': ''}`}>
            {!hideName && (name !== lastName) && <strong className="lk-participant-name">{name}</strong>}
            <div className='flex space-x-2'>
                {
                    entityType === 'img' && entry.attachedFiles?.map(
                        (file) =>
                            file.type.startsWith('image/') && (
                            <div key={file.name}>
                                <img onClick={()=>{
                                    AlertConfirm({
                                    maskClosable: true,
                                    custom: (
                                        <div className={'max-w-[95vw] max-h-[95vh] display-block'}>
                                            <img 
                                                key={file.name}
                                                src={URL.createObjectURL(file)}
                                                alt={file.name}
                                            />
                                        </div>
                                    )
                                })}}
                                    className='max-w-[150px]'
                                    key={file.name}
                                    src={URL.createObjectURL(file)}
                                    alt={file.name}
                                />
                            </div>
                            ),
                        )
                }
                {
                    entityType !== 'img' && 
                        <div className='flex flex-col text-nowrap'>
                            {formattedMessage}
                        </div>
                }
                {(!hideTimestamp || hasBeenEdited) && entityType !== 'img' && (
                    <div className='flex flex-col justify-end  text-right text-nowrap'>
                        <span className="lk-timestamp">
                            {hasBeenEdited && 'edited '}
                            {time.toLocaleTimeString(locale, { timeStyle: 'short' })}
                        </span>
                    </div>
                )}
            </div>
        </div>
        {/* <span className="lk-message-attachements">
          {entry.attachedFiles?.map(
            (file) =>
              file.type.startsWith('image/') && (
                <img
                  style={{ maxWidth: '300px', maxHeight: '300px' }}
                  key={file.name}
                  src={URL.createObjectURL(file)}
                  alt={file.name}
                />
              ),
          )}
        </span> */}
      </li>
    );
  },
);

/** @public */
export function formatChatMessageLinks(message: string): React.ReactNode {
  return tokenize(message, createDefaultGrammar()).map((tok, i) => {
    if (typeof tok === `string`) {
      return tok;
    } else {
      const content = tok.content.toString();
      const href =
        tok.type === `url`
          ? /^http(s?):\/\//.test(content)
            ? content
            : `https://${content}`
          : `mailto:${content}`;
      return (
        <a className="lk-chat-link" key={i} href={href} target="_blank" rel="noreferrer">
          {content}
        </a>
      );
    }
  });
}
