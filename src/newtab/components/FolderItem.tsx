import React, { useContext, useState } from "react"
import { IFolder, IFolderItem } from "../helpers/types"
import { isFolderItemNotUsed, findTabsByURL } from "../helpers/utils"
import { Action, DispatchContext, IAppState, wrapIntoTransaction } from "../state"
import { DropdownMenu } from "./DropdownMenu"
import { showMessage, showMessageWithUndo } from "../helpers/actions"
import { EditableTitle } from "./EditableTitle"

export function FolderItem(props: {
  item: IFolderItem;
  folder: IFolder;
  inEdit: boolean
  appState: IAppState
}) {
  const { dispatch } = useContext(DispatchContext)
  const [showMenu, setShowMenu] = useState<boolean>(false)

  function onRenameItem() {
    setShowMenu(false)
    setEditing(true)
  }

  function onOpenNewTab() {
    chrome.tabs.create({ url: props.item.url })
    setShowMenu(false)
  }

  function setEditing(val: boolean) {
    dispatch({
      type: Action.UpdateAppState,
      newState: { itemInEdit: val ? props.item.id : undefined }
    })
  }

  function trySaveTitle(newTitle: string) {
    if (props.item.title !== newTitle) {
      wrapIntoTransaction(() => {
      dispatch({
        type: Action.UpdateFolderItem,
        folderId: props.folder.id,
        itemId: props.item.id,
        newTitle
      })
      })
    }
  }

  function onDeleteItem() {
    wrapIntoTransaction(() => {
    dispatch({
      type: Action.DeleteFolderItem,
      itemIds: [props.item.id]
    })
    })
    showMessageWithUndo("Bookmark has been deleted", dispatch)
  }

  function onCopyUrl() {
    navigator.clipboard.writeText(props.item.url)
    setShowMenu(false)
    showMessage("URL has been copied", dispatch)
  }

  function onEditUrl() {
    const newUrl = prompt("Edit URL", props.item.url)

    if (newUrl) {
      wrapIntoTransaction(() => {
      dispatch({
        type: Action.UpdateFolderItem,
        folderId: props.folder.id,
        itemId: props.item.id,
        url: newUrl
      })
      })
    }
  }

  function onArchive() {
    wrapIntoTransaction(() => {
    dispatch({
      type: Action.UpdateFolderItem,
      folderId: props.folder.id,
      itemId: props.item.id,
      archived: true
    })
    })
    showMessageWithUndo("Bookmark has been archived", dispatch)
  }

  function onRestore() {
    wrapIntoTransaction(() => {
    dispatch({
      type: Action.UpdateFolderItem,
      folderId: props.folder.id,
      itemId: props.item.id,
      archived: false
    })
    })
    showMessage("Bookmark has been restored", dispatch)
  }

  function onContextMenu(e: React.MouseEvent) {
    setShowMenu(true)
    e.preventDefault()
  }

  function onCloseTab() {
    const tabs = findTabsByURL(props.item.url, props.appState.tabs)
    const tabIds = tabs.filter(t => t.id).map(t => t.id!)
    dispatch({
      type: Action.CloseTabs,
      tabIds: tabIds
    })
  }

  const folderItemOpened = findTabsByURL(props.item.url, props.appState.tabs).length !== 0
  const titleClassName = "folder-item__inner__title "
    + (folderItemOpened ? "opened " : "")
    + (props.appState.showNotUsed && isFolderItemNotUsed(props.item, props.appState.historyItems) ? "not-used " : "")

  return (
    <div className={
      "folder-item "
      + (showMenu ? "selected " : "")
      + (props.item.archived ? "archived " : "")
    }>
      {showMenu && !props.item.isSection ? (
        <DropdownMenu onClose={() => setShowMenu(false)} className={"dropdown-menu--folder-item"} topOffset={4}>
          <button className="dropdown-menu__button focusable" onClick={onOpenNewTab}>Open in New Tab</button>
          <button className="dropdown-menu__button focusable" onClick={onRenameItem}>Rename</button>
          <button className="dropdown-menu__button focusable" onClick={onCopyUrl}>Copy url</button>
          <button className="dropdown-menu__button focusable" onClick={onEditUrl}>Edit url</button>
          {
            props.item.archived
              ? <button className="dropdown-menu__button focusable" onClick={onRestore}>Restore</button>
              : <button className="dropdown-menu__button focusable" onClick={onArchive}>Archive</button>
          }
          <button className="dropdown-menu__button dropdown-menu__button--dander focusable" onClick={onDeleteItem}>Delete</button>
        </DropdownMenu>
      ) : null}

      {showMenu && props.item.isSection ? (
        <DropdownMenu onClose={() => setShowMenu(false)} className={"dropdown-menu--folder-section"}>
          <button className="dropdown-menu__button focusable" onClick={onRenameItem}>Rename</button>
          <button className="dropdown-menu__button dropdown-menu__button--dander focusable" onClick={onDeleteItem}>Delete</button>
        </DropdownMenu>
      ) : null}

      <button className="folder-item__menu"
              onContextMenu={onContextMenu}
              onClick={() => setShowMenu(!showMenu)}>⋯
      </button>
      <a className={
           "folder-item__inner draggable-item "
           + (props.item.isSection ? "section " : "")
         }
         tabIndex={2}
         data-id={props.item.id}
         onClick={e => e.preventDefault()}
         title={props.item.url}
         href={props.item.url}
         onContextMenu={onContextMenu}>
        <img src={props.item.favIconUrl} alt=""/>
        <EditableTitle className={titleClassName}
                       inEdit={props.inEdit}
                       setEditing={setEditing}
                       initTitle={props.item.title}
                       search={props.appState.search}
                       onSaveTitle={trySaveTitle}
        />
        {
          folderItemOpened ? <button className="btn__close-tab stop-dad-propagation"
                                     tabIndex={2}
                                     title="Close the Tab"
                                     onClick={onCloseTab}
          ><span>✕</span></button> : null
        }
      </a>
    </div>
  )
}
