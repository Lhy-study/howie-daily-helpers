<script setup lang="ts">
import { ref, onMounted, onUnmounted, type Component } from 'vue'
import { createElement, type ReactElement } from 'react'
import { mountReact } from '../utils/mountReact'

const props = defineProps<{
  /** React 组件（来自 import.meta.glob 加载的 .tsx 模块 default 导出） */
  component: Component | any
  /** 传给 React 组件的 props */
  componentProps?: Record<string, any>
}>()

const el = ref<HTMLElement>()
let root: ReturnType<typeof mountReact> | null = null

onMounted(() => {
  if (!el.value) return
  const element = createElement(props.component, props.componentProps ?? {})
  root = mountReact(el.value, element)
})

onUnmounted(() => {
  root?.unmount()
  root = null
})
</script>

<template>
  <div ref="el" />
</template>
