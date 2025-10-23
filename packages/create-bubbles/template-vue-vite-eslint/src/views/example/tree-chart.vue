<script>
import { defineComponent, reactive, ref } from 'vue'

import BlocksTree from 'vue3-blocks-tree'

import 'vue3-blocks-tree/dist/vue3-blocks-tree.css'

export default defineComponent({
  components: {
    BlocksTree,
  },
  setup() {
    const selected = ref([])
    const treeOrientation = ref('0')
    const treeData = reactive({
      label: 'root',
      expand: true,
      some_id: 1,
      children: [
        { label: 'child 1', some_id: 2 },
        { label: 'child 2', some_id: 3 },
        {
          label: 'subparent 1',
          some_id: 4,
          expand: false,
          children: [
            { label: 'subchild 1', some_id: 5 },
            {
              label: 'subchild 2',
              some_id: 6,
              expand: false,
              children: [
                { label: 'subchild 11', some_id: 7 },
                { label: 'subchild 22', some_id: 8 },
              ],
            },
          ],
        },
      ],
    })

    const toggleSelect = (node, isSelected) => {
      isSelected ? selected.value.push(node.some_id) : selected.value.splice(selected.value.indexOf(node.some_id), 1)
      if (node.children && node.children.length) {
        node.children.forEach((ch) => {
          toggleSelect(ch, isSelected)
        })
      }
    }

    return {
      treeData,
      selected,
      toggleSelect,
      treeOrientation,
    }
  },
})
</script>

<template>
  <h1>Basic</h1>
  <div>
    <BlocksTree :data="treeData" :horizontal="treeOrientation === '1'" :collapsable="true" />
  </div>

  <h1>With slots</h1>
  <div>
    <BlocksTree :data="treeData" :horizontal="treeOrientation === '1'" :collapsable="false" :props="{ label: 'label', expand: 'expand', children: 'children', key: 'some_id' }">
      <template #node="{ data, context }">
        <span>
          <input type="checkbox" :checked="selected.includes(data.some_id)" @change="(e) => toggleSelect(data, e.target.checked)"> {{ data.label }}
        </span>
        <br>
        <span v-if="data.children && data.children.length">
          <a href="#" @click="context.toggleExpand">toggle expand</a>
        </span>
      </template>
    </BlocksTree>
    <div>
      Selected: {{ selected }}
    </div>
  </div>

  <h1>Change orientation</h1>
  <select v-model="treeOrientation">
    <option value="0">
      Vertical
    </option>
    <option value="1">
      Horizontal
    </option>
  </select>
</template>
