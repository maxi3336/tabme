import React, { useContext, useEffect } from "react"
import { getSelectedItemsElements, getSelectedItemsIds } from "../helpers/selectionUtils"
import { DispatchContext } from "../state/actions"
import { Action } from "../state/state"

export const KeyboardManager = React.memo((props: {
  search: string;
}) => {
  const dispatch = useContext(DispatchContext)
  useEffect(() => {
    const onKeyUp = (e: KeyboardEvent) => {
      if (document.activeElement !== document.body) {
        return
      }

      if (getSelectedItemsElements().length > 0) {
        if (e.code === "Backspace" || e.code === "Delete") {
          dispatch({
            type: Action.DeleteFolderItems,
            itemIds: getSelectedItemsIds()
          })
          return
        }
      }

      if (e.code === "KeyZ" && (e.metaKey || e.ctrlKey)) {
        dispatch({
          type: Action.Undo,
          dispatch
        })
        return
      }

      const isLetterOrNumber = !!(e.key.length === 1 && e.key.match(/[a-z]|[а-я]|[0-9]/i))
      if (isLetterOrNumber) {
        // dispatch({
        //   type: Action.UpdateSearch,
        //   value: props.search + e.key
        // })
        ;(document.querySelector("input.search") as HTMLElement).focus()
      }
    }
    document.addEventListener("keydown", onKeyUp)

    return () => {
      document.removeEventListener("keydown", onKeyUp)
    }
  }, [])
  return null
})

