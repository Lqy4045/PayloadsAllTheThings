<template>
  <div class="web-region">
    <el-dropdown
      ref="messageDrop"
      placement="bottom-start"
      class="web_dropdown"
      trigger="click"
      :hide-on-click="false"
      @visible-change="visibleHandle"
    >
      <el-input
        style="width: 100%"
        :value="textMessage"
        placeholder="全部区域"
        class="web_dropdown_text"
        @mouseenter.native="isShowClear = true"
        @mouseleave.native="isShowClear = false"
      >
        <template #suffix>
          <div style="height: 36px; line-height: 36px">
            <i
              v-if="textMessage && isShowClear"
              class="inputBtn el-icon-circle-close"
              @click.stop="clearHandle"
            ></i>
            <i
              v-else
              class="inputBtn"
              :class="
                isDropdownVisible ? 'el-icon-arrow-up' : 'el-icon-arrow-down'
              "
            ></i>
          </div>
        </template>
      </el-input>
      <template #dropdown>
        <el-dropdown-menu class="web_dropdown_menu">
          <div style="padding: 10px 17px; font-size: 15px">行政区域</div>
          <el-dropdown-item class="web_dropdown_item">
            <div class="web-region-case">
              <!-- 国家切换 -->
              <div v-if="navCountryList.length > 1" class="web-region-nav">
                <el-tabs v-model="navCountryLevel" :stretch="true">
                  <el-tab-pane
                    v-for="item in navCountryList"
                    :key="item.name"
                    :label="item.label"
                    :name="item.name"
                  ></el-tab-pane>
                </el-tabs>
              </div>
              <div v-else style="width: 100%; height: 10px"></div>
              <!-- 搜索栏 -->
              <div class="web-region-input">
                <el-input
                  v-model.trim="searchText"
                  prefix-icon="el-icon-search"
                  type="text"
                  placeholder="搜索当前区域"
                  @input="query"
                ></el-input>
                <el-dropdown
                  ref="inputDrop"
                  class="inputDrop"
                  style="width: 100%"
                  trigger="click"
                >
                  <span></span>
                  <template #dropdown>
                    <el-dropdown-menu
                      class="input-drop-content"
                      :append-to-body="false"
                      style="width: 520px; max-height: 40vh; overflow: auto"
                    >
                      <el-dropdown-item
                        v-for="(item, index) in currentListSearch"
                        :key="index"
                      >
                        <div
                          v-html="searchLight(item)"
                          @click="searchHandle(item)"
                        ></div>
                      </el-dropdown-item>
                    </el-dropdown-menu>
                  </template>
                </el-dropdown>
              </div>
              <!-- 选中栏 -->
              <div
                v-if="selectedText && isAnyTier"
                class="web-region-select flex-align-center"
              >
                <span class="web-region-select-text">{{ selectedText }}</span>
                <el-button type="primary" plain @click="change">选择</el-button>
              </div>
              <!-- 选择栏 -->
              <el-tabs
                v-model="level"
                :stretch="true"
                :before-leave="tabsLeaveHandle"
              >
                <el-tab-pane
                  v-for="item in navList"
                  :key="item.name"
                  :label="item.label"
                  :name="item.name"
                ></el-tab-pane>
              </el-tabs>
              <!-- 内容区域 -->
              <div
                :key="isDropdownVisible"
                v-loading="loading"
                class="web-region-content flex"
              >
                <template v-if="list.length">
                  <div
                    v-for="item in list"
                    :key="item.id"
                    class="web-region-item"
                    :class="{ 'region-active': match(item) }"
                    @click="pick(item)"
                  >
                    <span>
                      {{ item.name }}
                    </span>
                    <i
                      v-if="item.deleteFlag"
                      class="el-icon-remove"
                      style="font-size: 16px; color: red; margin-left: 5px"
                    ></i>
                  </div>
                </template>
                <div v-else class="content-nothing">
                  <span v-show="!loading">无匹配项目</span>
                </div>
              </div>
            </div>
          </el-dropdown-item>
        </el-dropdown-menu>
      </template>
    </el-dropdown>
  </div>
</template>
<script>
import _ from "lodash";
export default {
  name: "WebRegion",
  props: {
    configs: {
      type: Object,
      default: () => {
        return {
          label: "name",
          value: "adcode",
          children: "districts"
        };
      }
    },
    value: {
      type: Array,
      default: () => []
    },
    isAnyTier: {
      type: Boolean,
      default: false
    },
    hotList: {
      type: Array,
      default: () => [
        "北京市",
        "成都市",
        "上海市",
        "广州市",
        "深圳市",
        "杭州市",
        "重庆市",
        "武汉市",
        "西安市",
        "长沙市",
        "南京市",
        "苏州市",
        "贵阳市",
        "郑州市",
        "济南市",
        "合肥市",
        "南宁市",
        "太原市",
        "成都市",
        "天津市"
      ]
    },
    regionList: {
      type: Array,
      required: true,
      default: () => []
    }
  },
  created() {
    console.log({ regionListcreated: this.regionList });
    const { children } = this.configs;
    if (!this.regionList.length) return;
    this.listCountry = _.cloneDeep(this.regionList);

    this.filterRegionData(this.listCountry[0] && this.listCountry[0][children]);
    this.fetch();
  },
  data() {
    return {
      isShowClear: false,
      isDropdownVisible: false,
      loading: false,
      textMessage: "",
      searchText: "",
      list: [],
      listSearch: [],
      currentListSearch: [],
      listHot: [],
      listCountry: [],
      listProvince: [],
      listCity: [],
      listArea: [],
      navCountryLevel: "mainland",
      level: "1",
      levelContain: {
        0: "hot",
        1: "province",
        2: "city",
        3: "area"
      },

      navCountryList: [
        {
          label: "内地",
          name: "mainland"
        }
      ],
      patchData: [
        {
          adcode: "",
          deleteFlag: false,
          id: "",
          name: "全市",
          type: ""
        }
      ],
      navList: [],
      region: {
        province: undefined,
        city: undefined,
        area: undefined
      },
      mainlandArr: [],
      otherArr: [],
      internationArr: [],
      mainlandList: [
        "澳门特别行政区",
        "其他国家和地区",
        "台湾省",
        "香港特别行政区"
      ],
      otherList: ["澳门特别行政区", "台湾省", "香港特别行政区"],
      internationList: ["其他国家和地区"]
    };
  },
  computed: {
    //显示选择
    selectedText() {
      const arr = [];
      const { label } = this.configs;
      const { country, province, city, area } = this.region;
      if (country) arr.push(country[label]);
      if (province) arr.push(province[label]);
      if (city) arr.push(city[label]);
      if (area) arr.push(area[label]);
      return arr.join("/").replace("/全部", "");
    },
    //选中高亮
    match() {
      return function (item) {
        if (!item || !Object.keys(item).length) return false;
        const { value } = this.configs;
        const { country, province, city, area } = this.region;
        switch (this.level) {
          case "0":
            return country && country[value] === item[value];
          case "1":
            return province && province[value] === item[value];
          case "2":
            return city && city[value] === item[value];
          case "3":
            return area && area[value] === item[value];
        }
      };
    },
    //搜索高亮
    searchLight() {
      return function (data) {
        return data.text.replace(
          this.searchText,
          `<span class='fontColor'>${this.searchText}</span>`
        );
      };
    }
  },
  watch: {
    regionList: {
      handler(value) {
        const { children } = this.configs;
        if (!value.length) return;
        this.listCountry = _.cloneDeep(value);

        this.filterRegionData(
          this.listCountry[0] && this.listCountry[0][children]
        );
        this.fetch();
      },
      deep: true
    },
    value() {
      console.log("watchValue");
      this.showRegion();
    },
    navCountryLevel() {
      console.log("watchNavCountryLevel");
      this.initList();
    },
    level(value) {
      console.log("watchLevel");
      switch (value) {
        case "0":
          this.list = this.listHot;
          break;
        case "1":
          this.list = this.listProvince;
          break;
        case "2":
          this.list = this.listCity;
          break;
        case "3":
          this.list = this.listArea.length ? this.listArea : this.patchData;
          break;
      }
      this.setCityNavList();
      this.searchText = "";
    }
  },
  methods: {
    //获取当前是否有港澳台数据
    getNavCountryList() {
      const { label, value, children } = this.configs;
      const data = this.listCountry[0][children];
      console.log({ data });
      this.navCountryList = [
        {
          label: "内地",
          name: "mainland"
        }
      ];
      if (data.filter(item => this.otherList.includes(item[label])).length) {
        console.log({ 1: 1 });
        this.navCountryList = this.navCountryList.concat([
          {
            label: "港澳台",
            name: "other"
          }
        ]);
        this.otherArr = data
          .filter(item => this.otherList.includes(item[label]))
          .map(item => item[value]);
      }
      if (
        data.filter(item => this.internationList.includes(item[label])).length
      ) {
        console.log({ 1: 2 });
        this.navCountryList = this.navCountryList.concat([
          {
            label: "国际",
            name: "internation"
          }
        ]);
        this.internationArr = data
          .filter(item => this.internationList.includes(item[label]))
          .map(item => item[value]);
      }
    },
    //获取搜索数据
    getSearchData() {
      let target = "-";
      const { label, value, children } = this.configs;
      if (
        !(this.regionList && this.regionList[0] && this.regionList[0][children])
      )
        return;
      const arr = [];
      this.regionList[0][children].forEach(province => {
        if (province[children] && province[children].length) {
          if (this.isAnyTier) {
            arr.push({
              text: `${province[label]} `,
              adcode: [province[value]]
            });
          }
          province[children].forEach(city => {
            if (city[children] && city[children].length) {
              if (this.isAnyTier) {
                arr.push({
                  text: `${province[label]}${target}${city[label]} `,
                  adcode: [province[value], city[value]]
                });
              }
              city[children].forEach(area => {
                arr.push({
                  text: `${province[label]}${target}${city[label]}${target}${area[label]} `,
                  adcode: [province[value], city[value], area[value]]
                });
              });
            } else {
              arr.push({
                text: `${province[label]}${target}${city[label]} `,
                adcode: [province[value], city[value]]
              });
            }
          });
        } else {
          arr.push({
            text: `${province[label]} `,
            adcode: [province[value]]
          });
        }
      });
      this.listSearch = arr;
    },
    searchHandle(data) {
      console.log({ data });
      this.$emit("update:value", data.adcode);
      this.$emit("change", data.adcode);
      this.$refs.messageDrop.handleClose();
    },
    // 阻止nav切换
    tabsLeaveHandle(e) {
      const arr = ["11", "22"];
      if (arr.includes(e)) {
        return false;
      } else {
        return true;
      }
    },
    fetch() {
      // 设置二级nav（省、市、区）
      this.setCityNavList();
      // 重置数据
      this.resetData();
      // 初始化数据
      this.initList();
      this.getNavCountryList();
      // 回显数据
      this.showRegion();
      //获取搜索数据
      this.getSearchData();
    },
    //初始化数据
    async initList() {
      console.log("initList");
      const { label, value, children } = this.configs;
      let data = [];
      this.resetData();
      switch (this.navCountryLevel) {
        case "mainland":
          if (
            !(
              this.listCountry &&
              this.listCountry.length &&
              this.listCountry[0]
            )
          )
            return;
          // 获取内地数据
          data = this.filterListByCountry(this.listCountry[0][children]);
          this.listProvince = _.cloneDeep(data);
          this.searchRegionByName();
          this.navList = [
            {
              label: "热门城市",
              name: "0"
            },
            {
              label: "省/直辖市",
              name: "1"
            },
            {
              label: null,
              name: "11"
            },
            {
              label: null,
              name: "22"
            }
          ];
          this.level = "0";
          this.list = this.listHot;
          break;
        case "other":
          data = this.filterListByCountry(this.listCountry[0][children]);
          this.list = data;
          this.listProvince = _.cloneDeep(data);
          this.$nextTick(() => {
            this.navList = [
              {
                label: "港澳台",
                name: "1"
              },
              {
                label: null,
                name: "11"
              },
              {
                label: null,
                name: "22"
              }
            ];
          });
          this.level = "1";
          break;
        case "internation":
          data = this.filterListByCountry(this.listCountry[0][children]);
          this.list = data;
          this.listProvince = _.cloneDeep(data);
          this.$nextTick(() => {
            this.navList = [
              {
                label: "其他国家",
                name: "1"
              },
              {
                label: null,
                name: "11"
              },
              {
                label: null,
                name: "22"
              }
            ];
          });
          this.level = "1";
          break;
      }
    },
    //数据回显
    showRegion() {
      const { label, value, children } = this.configs;
      console.log(
        "回显数据",
        label,
        value,
        children,
        this.value,
        this.listProvince
      );
      if (this.value && this.value.length) {
        let arr = this.value;
        let textArr = [];
        this.switchCountry(this.value[0]);
        this.listCountry.forEach(country => {
          if (!(country && country[children])) return;
          this.listProvince = this.filterListByCountry(country[children]);
          country[children].forEach(province => {
            if (province[value] === arr[0]) {
              this.region.province = province;
              this.listCity = province[children];
              if (province) textArr.push(province[label]);
            }
            province[children].forEach(city => {
              if (city[value] === arr[1]) {
                console.log({ city });
                this.region.city = city;
                this.listArea = city[children];
                if (city) textArr.push(city[label]);
              }
              city[children].forEach(area => {
                if (area[value] === arr[2]) {
                  this.region.area = area;
                  if (area) textArr.push(area[label]);
                }
              });
            });
          });
        });
        this.textMessage = textArr.join("/");
        this.$nextTick(() => {
          this.level = String(arr.length);
        });
      } else {
        this.listProvince = this.listCountry.length
          ? this.filterListByCountry(this.listCountry[0][children])
          : [];
        this.textMessage = "";
        this.level = "0";
      }
    },
    //根据countryNav过滤数据
    filterListByCountry(data) {
      const { label, value } = this.configs;
      let filterData = [];
      if (this.navCountryLevel === "mainland") {
        filterData = data.filter(
          item => !this.mainlandList.includes(item[label])
        );
        this.mainlandArr = filterData.map(item => item[value]);
      } else if (this.navCountryLevel === "other") {
        filterData = data.filter(item => this.otherList.includes(item[label]));
        this.otherArr = filterData.map(item => item[value]);
      } else {
        filterData = data.filter(item =>
          this.internationList.includes(item[label])
        );
        this.internationArr = filterData.map(item => item[value]);
      }
      return filterData;
    },
    // 往数据增加全部选项
    filterRegionData(data) {
      const { children } = this.configs;
      if (this.isAnyTier) {
        if (data && data.length) {
          data.forEach(item => {
            if (item[children] && item[children].length) {
              if (item[children].every(city => city.name !== "全部")) {
                item[children].unshift({
                  adcode: "",
                  deleteFlag: false,
                  districts: [],
                  id: "",
                  name: "全部",
                  type: 1,
                  isGoto: true
                });
              }
              this.filterRegionData(item[children]);
            }
          });
        }
      } else {
        return data;
      }
    },
    //监听当前组件展示隐藏事件
    async visibleHandle(type) {
      this.isDropdownVisible = type;
      this.level = null;
      this.resetData();
      this.showRegion();
      this.setCityNavList();
    },
    //清空
    clearHandle() {
      this.navCountryLevel = "mainland";
      this.resetData();
      this.change();
    },
    // 设置当前城市nav数据
    setCityNavList() {
      const { province, city, area } = this.region;
      let navList = [];
      if (this.navCountryLevel === "mainland") {
        navList = [
          {
            label: "热门城市",
            name: "0"
          }
        ];
      }
      switch (this.level) {
        case "0":
          this.navList = navList.concat([
            {
              label: province?.name || "省/直辖市",
              name: "1"
            },
            {
              label: null,
              name: "11"
            },
            {
              label: null,
              name: "22"
            }
          ]);
          break;
        case "1":
          this.navList = navList.concat([
            {
              label: province?.name || "省/直辖市",
              name: "1"
            },
            {
              label: null,
              name: "11"
            },
            {
              label: null,
              name: "22"
            }
          ]);
          break;
        case "2":
          this.navList = navList.concat([
            {
              label: province?.name || "省/直辖市",
              name: "1"
            },
            {
              label: city?.name || "请选择",
              name: "2"
            },
            {
              label: null,
              name: "11"
            }
          ]);
          break;
        case "3":
          this.navList = navList.concat([
            {
              label: province?.name || "省/直辖市",
              name: "1"
            },
            {
              label: city?.name || "请选择",
              name: "2"
            },
            {
              label: area?.name || "请选择",
              name: "3"
            }
          ]);
          break;
      }
    },
    resetData() {
      this.searchText = "";
      this.listProvince = [];
      this.listCity = [];
      this.listArea = [];
      this.region = {
        province: undefined,
        city: undefined,
        area: undefined
      };
    },
    //判断属于内地、港澳台、国际
    switchCountry(data) {
      console.log({ data });
      if (!data) return;
      const { mainlandArr, otherArr, internationArr } = this;
      console.log({ otherArr, internationArr });
      if (otherArr.includes(data)) {
        console.log("other");
        this.navCountryLevel = "other";
      } else if (internationArr.includes(data)) {
        console.log("internation");
        this.navCountryLevel = "internation";
      } else {
        console.log("mainland");
        this.navCountryLevel = "mainland";
      }
    },
    // 搜索当前行政区域数据
    query() {
      this.currentListSearch = this.listSearch.filter(item =>
        item.text.includes(this.searchText)
      );
      if (this.searchText && this.currentListSearch.length) {
        this.$refs.inputDrop.handleOpen();
      } else {
        this.$refs.inputDrop.handleClose();
      }
      // let tmp = []
      // // 首先匹配描述内容
      // if (this.searchText) {
      //     tmp = this.list.filter(val => val.name.toLowerCase().includes(this.searchText.toLowerCase()))
      // } else {
      //     let text = this.levelContain[this.level]
      //     let word = text.replace(text[0], text[0].toUpperCase())
      //     tmp = this[`list${ word } `]
      // }
      // this.list = tmp
    },
    //点击城市区域
    pick(data) {
      const { children } = this.configs;
      console.log({ 1: this.level, data });
      switch (this.level) {
        case "0":
          this.region.province = this.searchProvinceByCityId(data.id);
          this.region.city = data;
          this.region.area = undefined;
          if (!(data[children] && data[children].length)) {
            this.change();
          } else {
            this.listCity = this.region.province[children];
            this.listArea = data[children];
            this.level = "2";
          }
          break;
        case "1":
          this.listCity = data[children];
          this.listArea = [];
          this.region.province = data;
          this.region.city = undefined;
          this.region.area = undefined;
          break;
        case "2":
          this.listArea =
            data[children] && data[children].length
              ? data[children]
              : this.patchData;
          this.region.city = data;
          this.region.area = undefined;
          if (!(data[children] && data[children].length)) {
            this.change();
          }
          break;
        case "3":
          this.region.area = data;
          this.change();
          break;
      }
      if (Number(this.level) >= 3) return;
      this.level = String(+this.level + 1);
    },
    searchProvinceByCityId(id) {
      const { children } = this.configs;
      const data = this.listCountry[0][children];
      const arr = data.filter(province => {
        let cityArr = province[children].filter(city => city.id == id);
        return cityArr?.length;
      });
      return arr.length ? arr[0] : "";
    },
    searchRegionByName() {
      const { label, children } = this.configs;
      const data = this.listCountry[0][children];
      console.log({ searchRegionByName: data });
      const filterHotList = this.hotList;
      const regionArr = [];
      //提出所有市区数据
      data.forEach(province => {
        province[children].forEach(city => {
          regionArr.push(city);
        });
      });
      let list = regionArr.filter(item => filterHotList.includes(item[label]));
      let currentList = this.listProvince.length
        ? this.listProvince[0][children].length
          ? [this.listProvince[0][children][1]]
          : []
        : [];
      this.listHot = list.length ? list : currentList;
      this.listHot = this.listHot.sort(
        function compareFunction(param1, param2) {
          return param1[label].localeCompare(param2[label], "zh");
        }
      );
    },
    async change() {
      const { value } = this.configs;
      const arr = [];
      const { province, city, area } = this.region;
      if (province) arr.push(province[value]);
      if (city) arr.push(city[value]);
      if (area) arr.push(area[value]);
      //过滤空数组
      let filterArr = arr.filter(item => item);
      await this.$emit("update:value", filterArr);
      await this.$emit("change", filterArr);
      // this.showRegion()
      this.$refs.messageDrop.handleClose();
    }
  }
};
</script>
<style lang="scss" scoped>
.web_dropdown_item:hover,
.web_dropdown_item:focus {
  background-color: #fff;
  color: #3b3b3b;
}

.web_dropdown {
  width: 100%;
  // .web-region-show{
  //     width: 100%;
  //     height: ;
  // }
}

.web_dropdown_text {
  width: 220px;
  caret-color: transparent;

  .inputBtn {
    cursor: pointer;
    padding-right: 8px;
  }
}

.web-region-case {
  width: 520px;

  ::deep.el-tabs__item {
    width: 60px;
    font-size: 14px;
    height: auto;
    padding-top: 0px;
  }

  .web-region-nav {
    ::deep.el-tabs__header {
      margin-bottom: 5px;
    }

    ::deep.el-tabs__nav-wrap::after,
    ::deep.el-tabs__active-bar {
      display: none;
    }

    ::deep.el-tabs__item.is-top.is-active {
      background-color: #3172e5;
      color: #fff !important;
    }

    ::deep.el-tabs__item {
      padding: 0;
    }
  }

  .web-region-input {
    position: relative;

    ::deep.el-input {
      input {
        background-color: #f2f2f2;
      }
    }

    .inputDrop {
      position: absolute;
      top: 30px;
      left: 0;
    }
  }

  .web-region-select {
    padding: 3px 0;

    .web-region-select-text {
      cursor: auto;
      color: #3172e5;
      margin-right: 20px;
    }
  }

  .web-region-content {
    flex-wrap: wrap;

    .web-region-item {
      padding: 5px 10px;

      &:hover {
        background-color: #3172e5;
        opacity: 0.6;
        color: #fff;
      }
    }

    .content-nothing {
      width: 100%;
      text-align: center;
    }

    .region-active {
      background-color: #3172e5;
      color: #fff;
    }
  }
}
</style>
<style lang="scss">
.el-dropdown-menu__item:not(.is-disabled):focus,
.el-dropdown-menu__item:not(.is-disabled):hover {
  background-color: #fff !important;
  color: #343434 !important;
}
</style>
