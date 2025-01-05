<script setup lang="ts">
const { VITE_PUBLIC_PATH } = import.meta.env;
import axios from "axios";
import Region from "@/components/Region/index.vue";
import { onMounted, reactive } from "vue";
defineOptions({
  name: "Welcome"
});
let addressConfig = reactive({
  regionList: []
});
onMounted(async () => {
  let { data } = await axios(`${VITE_PUBLIC_PATH}files/region.json`);
  addressConfig.regionList = data.data;
});
</script>

<template>
  <div>
    <Region
      v-if="addressConfig.regionList?.length"
      :is-any-tier="false"
      :region-list="addressConfig.regionList"
    ></Region>
  </div>
</template>
