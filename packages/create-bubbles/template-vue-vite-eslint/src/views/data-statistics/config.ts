import BCD from './CBC.vue'

const Abc = defineAsyncComponent(() =>
  import('.right/abc.vue'),
)

export const data = [
  { label: '1级', value: '1', children: [
    { label: '1-1级', value: '1-1', right: Abc, result: BCD },
  ] },
]
