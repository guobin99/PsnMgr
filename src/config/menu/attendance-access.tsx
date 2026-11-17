import type { DomainSeed } from '@/types/navigation';

/** 考勤管理：5 个分组、26 个页面 */
export const attendanceDomain: DomainSeed = {
  key: 'attendance',
  label: '考勤管理',
  permission: 'attendance:view',
  description: '账套与规则、考勤数据、异常处理、拍照考勤与统计报表',
  groups: [
    {
      key: 'attendance-basic-group',
      label: '基础设置',
      items: [
        ['账套管理', '/attendance/account', 'attendance:account:view'],
        ['考勤规则', '/attendance/rule', 'attendance:rule:view'],
        ['假种定义', '/attendance/leave-type', 'attendance:leaveType:view'],
        ['法定假定义', '/attendance/holiday', 'attendance:holiday:view'],
        ['考勤机设置', '/attendance/terminal', 'attendance:terminal:view'],
        ['人员考勤信息', '/attendance/person', 'attendance:person:view'],
        ['班次设置', '/attendance/shift', 'attendance:shift:view'],
        ['安排班次', '/attendance/schedule', 'attendance:schedule:view'],
      ],
    },
    {
      key: 'attendance-data-group',
      label: '考勤数据',
      items: [
        ['考勤数据下载', '/attendance/download', 'attendance:download:view'],
        ['原始刷卡数据', '/attendance/raw', 'attendance:raw:view'],
        ['外进外出数据', '/attendance/out', 'attendance:out:view'],
        ['每日考勤', '/attendance/daily', 'attendance:daily:view'],
        ['历史考勤', '/attendance/history', 'attendance:history:view'],
        ['生物识别考勤机管理', '/attendance/biometric', 'attendance:biometric:view'],
      ],
    },
    {
      key: 'attendance-exception-group',
      label: '异常处理',
      items: [
        ['请假登记', '/attendance/leave', 'attendance:leave:view'],
        ['班次调整', '/attendance/adjust', 'attendance:adjust:view'],
        ['调休补班', '/attendance/makeup', 'attendance:makeup:view'],
        ['加班登记', '/attendance/overtime', 'attendance:overtime:view'],
        ['增补刷卡', '/attendance/makeup-card', 'attendance:makeupCard:view'],
        ['补出勤补加班', '/attendance/supplement', 'attendance:supplement:view'],
      ],
    },
    {
      key: 'attendance-photo-group',
      label: '拍照考勤机',
      items: [
        ['照片对比', '/attendance/photo-compare', 'attendance:photo:compare'],
        ['实时显示', '/attendance/photo-realtime', 'attendance:photo:realtime'],
        ['配置参数', '/attendance/photo-config', 'attendance:photo:config'],
      ],
    },
    {
      key: 'attendance-report-group',
      label: '统计报表',
      items: [
        ['考勤日报表', '/attendance/report/daily', 'attendance:report:daily'],
        ['考勤月报表', '/attendance/report/month', 'attendance:report:month'],
        ['考勤年报表', '/attendance/report/year', 'attendance:report:year'],
      ],
    },
  ],
};

/** 门禁管理：7 个分组、37 个页面 */
export const accessDomain: DomainSeed = {
  key: 'access',
  label: '门禁管理',
  permission: 'access:view',
  description: '控制器与时段、授权下发、联动控制、远程监控、记录查询与系统维护',
  groups: [
    {
      key: 'access-device-group',
      label: '设备与时段',
      items: [
        ['控制器设置', '/access/controller', 'access:controller:view'],
        ['门属性设置', '/access/door', 'access:door:view'],
        ['门开关时段设置', '/access/door-time', 'access:doorTime:view'],
        ['门特殊时段设置', '/access/door-special', 'access:doorSpecial:view'],
        ['人进出时段设置', '/access/psn-time', 'access:psnTime:view'],
        ['人特殊时段设置', '/access/psn-special', 'access:psnSpecial:view'],
        ['进出权限方案管理', '/access/scheme', 'access:scheme:view'],
        ['扩展点设置', '/access/extension-point', 'access:extensionPoint:view'],
      ],
    },
    {
      key: 'access-auth-group',
      label: '授权与下发',
      items: [
        ['人员设置', '/access/person', 'access:person:view'],
        ['门权限设置', '/access/permission', 'access:permission:view'],
        ['超级卡或密码', '/access/super-card', 'access:superCard:view'],
        ['刷卡添加用户', '/access/card-add', 'access:cardAdd:view'],
        ['管理卡设置', '/access/manage-card', 'access:manageCard:view'],
      ],
    },
    {
      key: 'access-linkage-group',
      label: '联动与控制',
      items: [
        ['控制器联动设置', '/access/linkage', 'access:linkage:view'],
        ['报警输出设置', '/access/alarm-out', 'access:alarmOut:view'],
        ['多门互锁设置', '/access/interlock', 'access:interlock:view'],
        ['紧急群组设置', '/access/emergency', 'access:emergency:view'],
        ['首卡开门设置', '/access/first-card', 'access:firstCard:view'],
        ['多卡开门设置', '/access/multi-card', 'access:multiCard:view'],
        ['会议管理', '/access/meeting', 'access:meeting:view'],
        ['DVS 联动', '/access/dvs', 'access:dvs:view'],
      ],
    },
    {
      key: 'access-monitor-group',
      label: '远程监控',
      items: [
        ['门禁控制台', '/access/console', 'access:console:view'],
        ['电子地图设计', '/access/map-design', 'access:map:design'],
        ['地图实时监控', '/access/map-monitor', 'access:map:monitor'],
        ['人脸识别终端', '/access/face-terminal', 'access:faceTerminal:view'],
      ],
    },
    {
      key: 'access-record-group',
      label: '记录查询',
      items: [
        ['正常通行记录', '/access/record/normal', 'access:record:normal'],
        ['异常通行记录', '/access/record/abnormal', 'access:record:abnormal'],
        ['报警事件记录', '/access/record/alarm', 'access:record:alarm'],
        ['实时监控记录', '/access/record/realtime', 'access:record:realtime'],
      ],
    },
    {
      key: 'access-finger-tz-group',
      label: '指纹门禁',
      items: [
        ['时段设置', '/access/finger/time', 'access:finger:time'],
        ['时段组别设置', '/access/finger/group', 'access:finger:group'],
        ['开锁组合设置', '/access/finger/combo', 'access:finger:combo'],
        ['人员时段设置', '/access/finger/person', 'access:finger:person'],
        ['生物识别门禁机管理', '/access/finger/terminal', 'access:finger:terminal'],
      ],
    },
    {
      key: 'access-maintain-group',
      label: '系统维护',
      items: [
        ['门禁系统参数', '/access/param', 'access:param:view'],
        ['扩展功能设置', '/access/extension', 'access:extension:view'],
        ['清理过期数据', '/access/clean', 'access:clean:view'],
      ],
    },
  ],
};
