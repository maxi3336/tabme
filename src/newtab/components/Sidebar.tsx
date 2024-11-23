import React, { useContext, useEffect, useState } from "react"
import { createFolder, showMessage } from "../helpers/actionsHelpers"
import { SidebarHistory } from "./SidebarHistory"
import { SidebarOpenTabs } from "./SidebarOpenTabs"
import { isTabmeTab } from "../helpers/isTabmeTab"
import { convertTabToItem, getCurrentData } from "../helpers/utils"
import { DropdownMenu } from "./DropdownMenu"
import { CL } from "../helpers/classNameHelper"
import { Action, IAppState } from "../state/state"
import { DispatchContext } from "../state/actions"
import Tab = chrome.tabs.Tab
import { wrapIntoTransaction } from "../state/actions"
import IconClean from "../icons/clean.svg"
import IconStash from "../icons/stash.svg"
import IconPin from "../icons/pin.svg"

export function Sidebar(props: {
  appState: IAppState;
}) {

  const dispatch = useContext(DispatchContext)
  const keepSidebarOpened = !props.appState.sidebarCollapsed || props.appState.sidebarHovered
  const sidebarClassName = keepSidebarOpened ? "" : "collapsed"

  const onSidebarMouseEnter = () => {
    if (!props.appState.sidebarCollapsed) {
      return
    }

    dispatch({
      type: Action.UpdateAppState,
      newState: { sidebarHovered: true }
    })
  }

  const onSidebarMouseLeave = (e: any) => {

    if (!props.appState.sidebarCollapsed) {
      return
    }

    if (e.relatedTarget.id !== "toggle-sidebar-btn") {
      dispatch({
        type: Action.UpdateAppState,
        newState: { sidebarHovered: false }
      })
    }
  }

  function onToggleSidebar() {
    dispatch({
      type: Action.UpdateAppState, newState: {
        sidebarCollapsed: !props.appState.sidebarCollapsed,
        sidebarHovered: false
      }
    })
  }

  return (
    <div className={"app-sidebar " + sidebarClassName} onMouseEnter={onSidebarMouseEnter} onMouseLeave={onSidebarMouseLeave}>
      {
        props.appState.appLoaded ?
          <>
            <div className="app-sidebar__header">
              <span className="app-sidebar__header__text">Open tabs</span>
            </div>

            <SidebarOpenTabs
              tabs={props.appState.tabs}
              folders={props.appState.folders}
              search={props.appState.search}
              lastActiveTabIds={props.appState.lastActiveTabIds}
              currentWindowId={props.appState.currentWindowId}
            />
            <SidebarHistory search={props.appState.search} historyItems={props.appState.historyItems}/>
          </>
          : null
      }
    </div>
  )
}

function getDuplicatedTabs(cb: (value: Tab[]) => void): void {
  const tabsByUrl = new Map<string, Tab[]>()
  chrome.windows.getCurrent(chromeWindow => {
    chrome.tabs.query({ windowId: chromeWindow.id }, (tabs) => {
      tabs.reverse().forEach(t => {
        if (!t.url) {
          return
        }
        if (!tabsByUrl.has(t.url)) {
          tabsByUrl.set(t.url, [])
        }
        const groupedTabsByUrl = tabsByUrl.get(t.url)!

        //special condition to now close current tab with Tabme but close all others
        if (isTabmeTab(t) && t.active) {
          groupedTabsByUrl.unshift(t)
        } else {
          groupedTabsByUrl.push(t)
        }
      })
      const duplicatedTabs: Tab[] = []
      tabsByUrl.forEach(groupedTabs => {
        for (let i = 1; i < groupedTabs.length; i++) {
          const duplicatedTab = groupedTabs[i]
          if (duplicatedTab.id) {
            duplicatedTabs.push(duplicatedTab)
          }
        }
      })
      cb(duplicatedTabs)
    })
  })
}
