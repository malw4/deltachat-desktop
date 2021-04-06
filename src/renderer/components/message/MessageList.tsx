import React, { useEffect, useRef, useState } from 'react'
import { MessageId, MessageListPage, MessageListStore } from "../../stores/messagelist";
import { Action } from "../../stores/store2";
import { MessageWrapper } from "./MessageWrapper";
import type { Message2, MessageDayMarker, MessageType } from "../../../shared/shared-types";
import { getLogger } from "../../../shared/logger";
import { DayMarkerInfoMessage } from "./Message";
import { MessageType2 } from '../../../shared/shared';
import { ChatStoreState } from '../../stores/chat';
import { C } from 'deltachat-node/dist/constants'

const log = getLogger('renderer/message/MessageList')


function withoutTopPages(messageListRef: React.MutableRefObject<any>, messageListWrapperRef: React.MutableRefObject<any>) {
	const pageOrdering = MessageListStore.state.pageOrdering

	let withoutPages = []
	let withoutPagesHeight = messageListRef.current.scrollHeight
	const messageListWrapperHeight = messageListWrapperRef.current.clientHeight

	for (let i = 0; i < pageOrdering.length - 1; i++) {
		const pageKey = pageOrdering[i]
		const pageHeight = document.querySelector('#' + pageKey).clientHeight
		const updatedWithoutPagesHeight = withoutPagesHeight - pageHeight

		if (updatedWithoutPagesHeight > messageListWrapperHeight * 4) {
			withoutPages.push(pageKey)
			withoutPagesHeight = updatedWithoutPagesHeight
		} else {
			break
		}
	}
	return withoutPages
}
function withoutBottomPages(messageListRef: React.MutableRefObject<any>, messageListWrapperRef: React.MutableRefObject<any>) {
	const messageListWrapperHeight = messageListWrapperRef.current.clientHeight
	let withoutPagesHeight = messageListRef.current.scrollHeight
		
	log.debug(`withoutBottomPages messageListWrapperHeight: ${messageListWrapperHeight} withoutPagesHeight: ${withoutPagesHeight}`)
	
	const pageOrdering = MessageListStore.state.pageOrdering
	let withoutPages = []
	for (let i = pageOrdering.length - 1; i > 0; i--) {
		const pageKey = pageOrdering[i]
		log.debug(`withoutBottomPages: pageKey: ${pageKey} i: ${i}`)
		const pageElement = document.querySelector('#' + pageKey)
		if (!pageElement) {
			log.debug(`withoutBottomPages: could not find dom element of pageKey: ${pageKey}. Skipping.`)
			continue
		}
		const pageHeight = pageElement.clientHeight
		const updatedWithoutPagesHeight = withoutPagesHeight - pageHeight
		log.debug(`withoutBottomPages messageListWrapperHeight: ${messageListWrapperHeight} updatedWithoutPagesHeight: ${updatedWithoutPagesHeight}`)
		if (updatedWithoutPagesHeight > messageListWrapperHeight * 4) {
			withoutPages.push(pageKey)
			withoutPagesHeight = updatedWithoutPagesHeight
		} else {
			log.debug(`withoutBottomPages: Found all removable pages. Breaking.`)
			break
		}
	}
	
	return withoutPages
}

const getPageElement = (pageKey: string) => document.querySelector('#' + pageKey)
const scrollBeforePage = (messageListRef: React.MutableRefObject<any>, pageKey: string, after?: boolean) => {
	const pageElement = getPageElement(pageKey)

	const pageOffsetTop = (pageElement as unknown as any).offsetTop

	if (after === true) {
		const pageHeight = pageElement.clientHeight
		messageListRef.current.scrollTop = pageOffsetTop + pageHeight - messageListRef.current.clientHeight
	} else {
		messageListRef.current.scrollTop = pageOffsetTop - messageListRef.current.clientHeight
	}	 
}

const MessageList = React.memo(function MessageList({
	chat,
	refComposer,
  }: {
	chat: ChatStoreState
	refComposer: todo
  }) {
	

	const [unreadMessages, setUnreadMessages] = useState(0)

	const messageListRef = useRef(null)
	const messageListWrapperRef = useRef(null)
	const messageListTopRef = useRef(null)
	const messageListBottomRef = useRef(null)
	const onMessageListStoreEffect = (action: Action) => {
	  if (action.type === 'SCROLL_BEFORE_LAST_PAGE') {
		log.debug(`SCROLL_BEFORE_LAST_PAGE`)		  
		setTimeout(() => {
			const lastPage = messageListStore.pages[messageListStore.pageOrdering[messageListStore.pageOrdering.length - 1]]

			if(!lastPage) {
				log.debug(`SCROLL_BEFORE_LAST_PAGE: lastPage is null, returning`)
				setTimeout(() => MessageListStore.doneCurrentlyLoadingPage())
				return
			}
			
			log.debug(`SCROLL_BEFORE_LAST_PAGE lastPage ${lastPage.key}`)		  

			scrollBeforePage(messageListRef, lastPage.key)
			setTimeout(() => MessageListStore.doneCurrentlyLoadingPage())
		})
	  }
	}

	const onMessageListStoreLayoutEffect = (action: Action) => {
	  if (action.type === 'SCROLL_TO_BOTTOM_AND_CHECK_IF_WE_NEED_TO_LOAD_MORE') {
		const scrollTop = messageListRef.current.scrollTop
		const scrollHeight = messageListRef.current.scrollHeight
		log.debug(
			`SCROLL_TO_BOTTOM_AND_CHECK_IF_WE_NEED_TO_LOAD_MORE scrollTop: ${scrollTop} scrollHeight ${scrollHeight}`
		)
		
		messageListRef.current.scrollTop = scrollHeight
		console.debug(messageListWrapperRef)
		const messageListWrapperHeight = messageListWrapperRef.current.clientHeight
		log.debug(`SCROLL_TO_BOTTOM_AND_CHECK_IF_WE_NEED_TO_LOAD_MORE: messageListWrapperHeight: ${messageListWrapperHeight} scrollHeight: ${scrollHeight}`)
		if (scrollHeight <= messageListWrapperHeight) {
			MessageListStore.doneCurrentlyLoadingPage()
			MessageListStore.loadPageBefore([], [{
				isLayoutEffect: true,
				action:{type: 'SCROLL_TO_BOTTOM_AND_CHECK_IF_WE_NEED_TO_LOAD_MORE', payload: {}, id: messageListStore.chatId}
			}])
		} else {
			setTimeout(() => MessageListStore.doneCurrentlyLoadingPage())
		}
	  } else if (action.type === 'SCROLL_TO_TOP_OF_PAGE_AND_CHECK_IF_WE_NEED_TO_LOAD_MORE') {
		const { pageKey } = action.payload
		const scrollTop = messageListRef.current.scrollTop
		const scrollHeight = messageListRef.current.scrollHeight
		log.debug(
			`SCROLL_TO_TOP_OF_PAGE_AND_CHECK_IF_WE_NEED_TO_LOAD_MORE scrollTop: ${scrollTop} scrollHeight ${scrollHeight}`
		)

		const pageElement = document.querySelector('#' + pageKey)
		if(!pageElement) {
			log.warn(
				`SCROLL_TO_TOP_OF_PAGE_AND_CHECK_IF_WE_NEED_TO_LOAD_MORE pageElement is null, returning`
			)
			setTimeout(() => MessageListStore.doneCurrentlyLoadingPage())
			return
		}
		pageElement.scrollIntoView(true)
		const firstChild = pageElement.firstElementChild
		if(!firstChild) {
			log.warn(
				`SCROLL_TO_TOP_OF_PAGE_AND_CHECK_IF_WE_NEED_TO_LOAD_MORE firstChild is null, returning`
			)
			setTimeout(() => MessageListStore.doneCurrentlyLoadingPage())
			return
		}
		console.debug(firstChild)
		firstChild.setAttribute('style', 'background-color: yellow')
		setTimeout(() => MessageListStore.doneCurrentlyLoadingPage())

	  } else if (action.type === 'SCROLL_BEFORE_FIRST_PAGE') {
		log.debug(`SCROLL_BEFORE_FIRST_PAGE`)		  
		const beforeFirstPage = messageListStore.pages[messageListStore.pageOrdering[1]]

		if(!beforeFirstPage) {
			log.debug(`SCROLL_BEFORE_FIRST_PAGE: beforeLastPage is null, returning`)
			setTimeout(() => MessageListStore.doneCurrentlyLoadingPage())
			return
		}
		
		document.querySelector('#' + beforeFirstPage.key).scrollIntoView()
		setTimeout(() => MessageListStore.doneCurrentlyLoadingPage())
	  } else if (action.type === 'INCOMING_MESSAGES') {
		  if (action.id !== MessageListStore.state.chatId) {
			  log.debug(`INCOMING_MESSAGES: action id mismatches state.chatId. Returning.`)
			  return
		  }

		  const countIncomingMessages = action.payload

		  const scrollTop = messageListRef.current.scrollTop
		  const scrollHeight = messageListRef.current.scrollHeight
		  const wrapperHeight = messageListWrapperRef.current.clientHeight
		  
		  const lastPageKey = MessageListStore.state.pageOrdering[MessageListStore.state.pageOrdering.length - 1]
		  const lastPage = MessageListStore.state.pages[lastPageKey]
		  
		  const isPreviousMessageLoaded = lastPage.messageIds[lastPage.messageIds.length - 1] === MessageListStore.state.messageIds[MessageListStore.state.messageIds.length - 2]
		  
		  log.debug(`INCOMING_MESSAGES: scrollHeight: ${scrollHeight} scrollTop: ${scrollTop} wrapperHeight: ${wrapperHeight}`)

		  const isScrolledToBottom = scrollTop >= scrollHeight - wrapperHeight 

		  const scrollToTopOfMessage = isScrolledToBottom && isPreviousMessageLoaded
		  log.debug(`INCOMING_MESSAGES: scrollToTopOfMessage ${scrollToTopOfMessage} isScrolledToBottom: ${isScrolledToBottom} isPreviousMessageLoaded: ${isPreviousMessageLoaded}`)

		  if (scrollToTopOfMessage) {
			const withoutPages = withoutTopPages(messageListRef, messageListWrapperRef)
			const messageId = MessageListStore.state.messageIds[MessageListStore.state.messageIds.length - 1] 

			MessageListStore.loadPageAfter(withoutPages, [
				{
					isLayoutEffect: true,
					action: {type: 'SCROLL_TO_BOTTOM_AND_CHECK_IF_WE_NEED_TO_LOAD_MORE', payload: messageId, id: messageListStore.chatId}
				},
			])
		  } else {
			  setUnreadMessages(value => value + countIncomingMessages)
		  }
	  }
	}

	const messageListStore = MessageListStore.useStore(onMessageListStoreEffect, onMessageListStoreLayoutEffect)
	
	
	const onMessageListTop: IntersectionObserverCallback = (entries) => {
		const pageOrdering = MessageListStore.state.pageOrdering
		log.debug(`onMessageListTop`)
		if(!entries[0].isIntersecting || MessageListStore.currentlyLoadingPage === true || pageOrdering.length === 0) return
		let withoutPages = withoutBottomPages(messageListRef, messageListWrapperRef)

		MessageListStore.loadPageBefore(withoutPages, [
			{
				isLayoutEffect: true,
				action: {type: 'SCROLL_BEFORE_FIRST_PAGE', payload: {}, id: messageListStore.chatId}
			},
		])

	}
	const onMessageListBottom: IntersectionObserverCallback = (entries)  => {
		const pageOrdering = MessageListStore.state.pageOrdering
		if(!entries[0].isIntersecting || MessageListStore.currentlyLoadingPage === true) return
		log.debug('onMessageListBottom')
		let withoutPages = []
		let withoutPagesHeight = messageListRef.current.scrollHeight
		const messageListWrapperHeight = messageListWrapperRef.current.clientHeight

		for (let i = 0; i < pageOrdering.length - 1; i++) {
			const pageKey = pageOrdering[i]
			const pageHeight = document.querySelector('#' + pageKey).clientHeight
			const updatedWithoutPagesHeight = withoutPagesHeight - pageHeight

			if (updatedWithoutPagesHeight > messageListWrapperHeight * 4) {
				withoutPages.push(pageKey)
				withoutPagesHeight = updatedWithoutPagesHeight
			} else {
				break
			}
		}
		MessageListStore.loadPageAfter(withoutPages, [
			{
				isLayoutEffect: false,
				action: {type: 'SCROLL_BEFORE_LAST_PAGE', payload: {}, id: messageListStore.chatId}
			},
		])
		
	}
	useEffect(() => {
		console.log('Rerendering MessageList')
		
		let onMessageListTopObserver = new IntersectionObserver(onMessageListTop, {
			root: null,
			rootMargin: '0px',
			threshold: 1.0
		});
		onMessageListTopObserver.observe(messageListTopRef.current)
		let onMessageListBottomObserver = new IntersectionObserver(onMessageListBottom, {
			root: null,
			rootMargin: '0px',
			threshold: 0
		});
		onMessageListBottomObserver.observe(messageListBottomRef.current)
		return () => {
			onMessageListTopObserver.disconnect()
			onMessageListBottomObserver.disconnect()
		}
	}, [])

	const iterateMessages = (mapFunction: (key: string, messageId: MessageId, messageIndex: number, message: Message2) => JSX.Element) => {
		return (
			<div className='message-list-wrapper' style={{height: '100%'}} ref={messageListWrapperRef}>
				<div id='message-list' ref={messageListRef}>   
					<div key='message-list-top' id='message-list-top' ref={messageListTopRef} />
					{messageListStore.pageOrdering.map((pageKey: string) => {
						return <MessagePage key={pageKey} page={messageListStore.pages[pageKey]} mapFunction={mapFunction}/>
					})}
					<div key='message-list-bottom' id='message-list-bottom' ref={messageListBottomRef} />
				</div>
			</div>
		)
	}


	return <>
		{iterateMessages((key, messageId, messageIndex, message) => {
            if (message.type === MessageType2.DayMarker) {
				return (
				  <DayMarkerInfoMessage key={key} timestamp={(message.message as MessageDayMarker).timestamp} />
				)
			} else if (message.type === MessageType2.MarkerOne) {
				return (
					<p key={key}>Not implemented yet</p>
				)
			} else if (message.type === MessageType2.Message) {
				return (
				  <ul key={key} id={key}>
					  <MessageWrapper
						key={key}
						message={(message.message as MessageType)}
						conversationType={chat.type === C.DC_CHAT_TYPE_GROUP ? 'group' : 'direct'}
						isDeviceChat={chat.isDeviceChat}
					  />
				  </ul>
				)
			} 
		})}
		{unreadMessages > 0 && <div className='unread-message-counter'>
			<div className='counter'>{unreadMessages}</div>
			<div className='jump-to-first-unread-message-button'/>
		</div>}
	</>
})

export default MessageList

export function MessagePage(
{ 
  page,
  mapFunction
} : {
	page: MessageListPage,
	mapFunction: (key: string, messageId: MessageId, messageIndex: number, message: Message2) => JSX.Element
}) { 
	const firstMessageIdIndex = page.firstMessageIdIndex
	return (
		<div className={'message-list-page'} id={page.key} key={page.key}>
		  
		  {page.messageIds.map((_messageId, index) => {
			const messageId: MessageId = _messageId as MessageId 
			const messageIndex = firstMessageIdIndex + index
			const message: Message2 = page.messages[index]
			const key = page.key + '-' + messageId + '-' + messageIndex
			return mapFunction(key, messageId, messageIndex, message)

		  })}
		</div>
	)
}
