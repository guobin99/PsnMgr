import type { DomainSeed } from '@/types/navigation';

/** 订餐管理：4 个分组、19 个页面 */
export const mealDomain: DomainSeed = {
  key: 'meal',
  label: '订餐管理',
  permission: 'meal:view',
  description: '订餐参数与规则、订餐业务办理、订餐报表与过期数据清理',
  groups: [
    {
      key: 'meal-basic-group',
      label: '基础设置',
      items: [
        ['系统参数设置', '/meal/param', 'meal:param:view'],
        ['订餐机设置', '/meal/terminal', 'meal:terminal:view'],
        ['订餐规则设置', '/meal/rule', 'meal:rule:view'],
        ['订餐时间设置', '/meal/time', 'meal:time:view'],
        ['食堂与区域', '/meal/area', 'meal:area:view'],
        ['菜品与类别', '/meal/ware', 'meal:ware:view'],
        ['每日菜品', '/meal/daily-dish', 'meal:dailyDish:view'],
        ['餐别设置', '/meal/repast', 'meal:repast:view'],
      ],
    },
    {
      key: 'meal-business-group',
      label: '订餐业务',
      items: [
        ['订餐数据下载', '/meal/download', 'meal:download:view'],
        ['订餐机控制台', '/meal/console', 'meal:console:view'],
        ['手工订餐', '/meal/manual', 'meal:manual:view'],
        ['撤销订餐', '/meal/cancel', 'meal:cancel:view'],
        ['订餐订单', '/meal/order', 'meal:order:view'],
        ['取餐核销', '/meal/verify', 'meal:verify:view'],
      ],
    },
    {
      key: 'meal-report-group',
      label: '订餐报表',
      items: [
        ['订餐数据明细', '/meal/report/detail', 'meal:report:detail'],
        ['订餐数据汇总', '/meal/report/summary', 'meal:report:summary'],
        ['未用餐明细', '/meal/report/unused', 'meal:report:unused'],
        ['未用餐汇总', '/meal/report/unused-summary', 'meal:report:unusedSummary'],
      ],
    },
    {
      key: 'meal-maintain-group',
      label: '系统维护',
      items: [['过期数据清理', '/meal/clean', 'meal:clean:view']],
    },
  ],
};

/** 访客管理：4 个分组、10 个页面 */
export const visitorDomain: DomainSeed = {
  key: 'visitor',
  label: '访客管理',
  permission: 'visitor:view',
  description: '访客预约与审核、访客卡与签到签离、访客记录报表与参数设置',
  groups: [
    {
      key: 'visitor-apply-group',
      label: '预约与审批',
      items: [
        ['访客预约登记', '/visitor/apply', 'visitor:apply:view'],
        ['预约审核', '/visitor/approve', 'visitor:approve:view'],
        ['访客预约记录', '/visitor/apply-record', 'visitor:applyRecord:view'],
      ],
    },
    {
      key: 'visitor-business-group',
      label: '访客业务',
      items: [
        ['访客卡登记', '/visitor/card', 'visitor:card:view'],
        ['访客签到签离', '/visitor/checkin', 'visitor:checkin:view'],
        ['访客通行登记', '/visitor/access', 'visitor:access:view'],
      ],
    },
    {
      key: 'visitor-record-group',
      label: '记录与报表',
      items: [
        ['访客签到记录', '/visitor/checkin-record', 'visitor:record:checkin'],
        ['访客进出记录', '/visitor/access-record', 'visitor:record:access'],
        ['访客报表', '/visitor/report', 'visitor:record:report'],
      ],
    },
    {
      key: 'visitor-param-group',
      label: '参数设置',
      items: [['访客参数设置', '/visitor/param', 'visitor:param:view']],
    },
  ],
};

/** 水控/巡更：2 个分组、15 个页面 */
export const utilityDomain: DomainSeed = {
  key: 'utility',
  label: '水控/巡更',
  permission: 'utility:view',
  description: '水控卡类与终端管理、采集汇总，巡更点位线路、计划与记录',
  groups: [
    {
      key: 'utility-water-group',
      label: '水控管理',
      items: [
        ['卡类设置', '/utility/water/card-type', 'utility:water:cardType'],
        ['终端机设置', '/utility/water/terminal', 'utility:water:terminal'],
        ['消费场合设置', '/utility/water/area', 'utility:water:area'],
        ['水控补贴机', '/utility/water/subsidy', 'utility:water:subsidy'],
        ['特殊卡管理', '/utility/water/special-card', 'utility:water:specialCard'],
        ['打折时段设置', '/utility/water/discount', 'utility:water:discount'],
        ['区域/场所设置', '/utility/water/site', 'utility:water:site'],
        ['采集记录', '/utility/water/record', 'utility:water:record'],
        ['采集数据汇总表', '/utility/water/report', 'utility:water:report'],
      ],
    },
    {
      key: 'utility-patrol-group',
      label: '巡更管理',
      items: [
        ['巡更点设置', '/utility/patrol/site', 'utility:patrol:site'],
        ['巡更线路设置', '/utility/patrol/route', 'utility:patrol:route'],
        ['巡更人员与计划', '/utility/patrol/plan', 'utility:patrol:plan'],
        ['巡更记录', '/utility/patrol/record', 'utility:patrol:record'],
        ['巡更日报', '/utility/patrol/daily', 'utility:patrol:daily'],
        ['巡更异常事件', '/utility/patrol/event', 'utility:patrol:event'],
      ],
    },
  ],
};
