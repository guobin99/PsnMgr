import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  App,
  Button,
  Card,
  Col,
  Empty,
  Input,
  List,
  Modal,
  Popconfirm,
  Row,
  Select,
  Space,
  Statistic,
  Tag,
  Tooltip,
  TreeSelect,
  Upload,
} from 'antd';
import {
  CheckOutlined,
  CloseOutlined,
  DeleteOutlined,
  ReloadOutlined,
  SearchOutlined,
  UploadOutlined,
} from '@ant-design/icons';
import { usePermission } from '@/hooks/usePermission';
import {
  batchUploadCardFaces,
  deleteCardFace,
  downloadCardFaceImage,
  fetchCardDeptTree,
  fetchCardFaceStat,
  fetchCardFaces,
  reviewCardFace,
  uploadCardFace,
} from '@/services/card';
import type { CardDeptNode, CardFaceRow, CardFaceStat } from '@/types/card';
import { FaceThumb, faceStatusTag, formatDateTime, invalidateFaceCache } from './shared';

function buildDeptOptions(nodes: CardDeptNode[]) {
  const map = new Map<
    number,
    { value: number; title: string; deptNo?: string; disabled: boolean; children: unknown[] }
  >();
  nodes.forEach((node) => {
    map.set(node.deptId, {
      value: node.deptId,
      title: node.deptName ?? '未命名部门',
      deptNo: node.deptNo ?? undefined,
      disabled: node.isDel === true,
      children: [],
    });
  });
  const roots: unknown[] = [];
  nodes.forEach((node) => {
    const current = map.get(node.deptId);
    if (!current) return;
    const parent = node.parentId != null ? map.get(node.parentId) : undefined;
    if (parent) (parent.children as unknown[]).push(current);
    else roots.push(current);
  });
  return roots as Array<{
    value: number;
    title: string;
    deptNo?: string;
    disabled: boolean;
    children: unknown[];
  }>;
}

/** 部门下拉搜索：按部门名称或部门编号模糊匹配（不区分大小写）。 */
function matchDeptOption(input: string, node: unknown) {
  const keyword = input.trim().toLowerCase();
  if (!keyword) return false;
  const item = node as { title?: unknown; deptNo?: string | null };
  const name = typeof item.title === 'string' ? item.title : '';
  return name.toLowerCase().includes(keyword) || (item.deptNo ?? '').toLowerCase().includes(keyword);
}

const EMPTY_STAT: CardFaceStat = { total: 0, withPhoto: 0, pending: 0, approved: 0, rejected: 0, noPhoto: 0 };

/** 人脸照片库：按人展示照片，支持上传替换、删除、审核与 ZIP 批量导入 */
export default function FacePage() {
  const { message } = App.useApp();
  const { has } = usePermission();

  const [stat, setStat] = useState<CardFaceStat>(EMPTY_STAT);
  const [statLoading, setStatLoading] = useState(false);
  const [deptNodes, setDeptNodes] = useState<CardDeptNode[]>([]);

  const [rows, setRows] = useState<CardFaceRow[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(false);
  const [keyword, setKeyword] = useState('');
  const [deptId, setDeptId] = useState<number | undefined>();
  const [faceStatus, setFaceStatus] = useState<number | undefined>();
  const [hasPhoto, setHasPhoto] = useState<string>('all');
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(24);

  const [photoTarget, setPhotoTarget] = useState<CardFaceRow | null>(null);
  const [uploading, setUploading] = useState(false);
  const [rejectTarget, setRejectTarget] = useState<CardFaceRow | null>(null);
  const [rejectReason, setRejectReason] = useState('');
  const [batchOpen, setBatchOpen] = useState(false);
  const [batchResult, setBatchResult] = useState<string | null>(null);
  const [batching, setBatching] = useState(false);

  const loadStat = useCallback(() => {
    setStatLoading(true);
    fetchCardFaceStat({ deptId, includeChildren: true })
      .then(setStat)
      .catch(() => setStat(EMPTY_STAT))
      .finally(() => setStatLoading(false));
  }, [deptId]);

  const loadList = useCallback(() => {
    setLoading(true);
    fetchCardFaces({
      keyword: keyword || undefined,
      deptId,
      includeChildren: true,
      faceStatus,
      hasPhoto: hasPhoto === 'all' ? undefined : hasPhoto === 'has',
      page,
      pageSize,
    })
      .then((result) => {
        setRows(result.items);
        setTotal(result.total);
      })
      .catch((error: unknown) => {
        setRows([]);
        setTotal(0);
        message.error(error instanceof Error ? error.message : '照片列表加载失败');
      })
      .finally(() => setLoading(false));
  }, [keyword, deptId, faceStatus, hasPhoto, page, pageSize, message]);

  useEffect(() => {
    fetchCardDeptTree(false)
      .then(setDeptNodes)
      .catch(() => setDeptNodes([]));
  }, []);

  useEffect(() => {
    loadStat();
  }, [loadStat]);

  useEffect(() => {
    loadList();
  }, [loadList]);

  const deptOptions = useMemo(() => buildDeptOptions(deptNodes), [deptNodes]);

  const refreshAll = (personId?: number) => {
    if (personId != null) invalidateFaceCache(personId);
    loadList();
    loadStat();
  };

  const handleUpload = async (file: File) => {
    if (!photoTarget) return false;
    setUploading(true);
    try {
      const result = await uploadCardFace(photoTarget.personId, file);
      const detail = `${result.sizeKb}KB，${result.width}×${result.height}`;
      if (result.approved === false) {
        message.warning(`照片已保存但自动驳回：${result.reason ?? '未通过自动审核'}（${detail}）`);
      } else {
        message.success(`照片已上传并通过自动审核（${detail}）`);
      }
      if (result.warning) message.info(result.warning);
      setPhotoTarget(null);
      refreshAll(photoTarget.personId);
    } catch (error) {
      message.error(error instanceof Error ? error.message : '上传失败');
    } finally {
      setUploading(false);
    }
    return false;
  };

  const handleDelete = async (record: CardFaceRow) => {
    try {
      await deleteCardFace(record.personId);
      message.success('照片已清空');
      refreshAll(record.personId);
    } catch (error) {
      message.error(error instanceof Error ? error.message : '删除失败');
    }
  };

  const handleDownload = async (record: CardFaceRow) => {
    try {
      await downloadCardFaceImage(record.personId, `${record.personNo ?? record.personId}.jpg`);
    } catch (error) {
      message.error(error instanceof Error ? error.message : '原图下载失败');
    }
  };

  const handleApprove = async (record: CardFaceRow) => {
    try {
      await reviewCardFace(record.personId, true);
      message.success('照片已通过审核');
      refreshAll(record.personId);
    } catch (error) {
      message.error(error instanceof Error ? error.message : '审核失败');
    }
  };

  const handleReject = async () => {
    if (!rejectTarget) return;
    if (!rejectReason.trim()) {
      message.warning('驳回时必须填写原因');
      return;
    }
    try {
      await reviewCardFace(rejectTarget.personId, false, rejectReason.trim());
      message.success('照片已驳回');
      setRejectTarget(null);
      setRejectReason('');
      refreshAll(rejectTarget.personId);
    } catch (error) {
      message.error(error instanceof Error ? error.message : '审核失败');
    }
  };

  const handleBatch = async (file: File) => {
    setBatching(true);
    try {
      const result = await batchUploadCardFaces(file);
      const rejected = result.rejected ?? 0;
      const autoRejected = result.autoRejected ?? [];
      setBatchResult(
        `批次 #${result.jobId}：共 ${result.total} 张，导入成功 ${result.success} 张，失败 ${result.failed} 张；` +
          `自动通过 ${result.approved ?? 0} 张，自动驳回 ${rejected} 张。` +
          (autoRejected.length > 0
            ? `首个自动驳回：${autoRejected[0].file} ${autoRejected[0].reason}`
            : result.errors.length > 0
              ? `首个失败：${result.errors[0].file} ${result.errors[0].message}`
              : ''),
      );
      refreshAll();
    } catch (error) {
      message.error(error instanceof Error ? error.message : '批量导入失败');
    } finally {
      setBatching(false);
    }
    return false;
  };

  return (
    <div className="system-workspace system-page-single">
      <Row gutter={12} className="card-stat-row">
        {[
          { title: '人员总数', value: stat.total },
          { title: '已采集', value: stat.withPhoto },
          { title: '缺照片', value: stat.noPhoto },
          { title: '待审核', value: stat.pending },
          { title: '已通过', value: stat.approved },
          { title: '已驳回', value: stat.rejected },
        ].map((item) => (
          <Col key={item.title} xs={12} sm={8} md={4}>
            <Card size="small" loading={statLoading}>
              <Statistic title={item.title} value={item.value} />
            </Card>
          </Col>
        ))}
      </Row>

      <Card size="small" className="filter-card">
        <Space wrap size={10}>
          <Input
            allowClear
            prefix={<SearchOutlined />}
            style={{ width: 220 }}
            placeholder="搜索编号 / 姓名 / 卡号"
            value={keyword}
            onChange={(event) => {
              setPage(1);
              setKeyword(event.target.value);
            }}
          />
          <TreeSelect
            style={{ width: 200 }}
            treeData={deptOptions as never}
            treeDefaultExpandAll
            allowClear
            showSearch
            filterTreeNode={(input, node) => matchDeptOption(input, node)}
            placeholder="搜索部门名称/编号"
            value={deptId}
            onChange={(value: number) => {
              setPage(1);
              setDeptId(value ?? undefined);
            }}
          />
          <Select
            allowClear
            style={{ width: 130 }}
            placeholder="照片状态"
            value={faceStatus}
            onChange={(value) => {
              setPage(1);
              setFaceStatus(value ?? undefined);
            }}
            options={[
              { value: 0, label: '未采集' },
              { value: 1, label: '待审核' },
              { value: 2, label: '已通过' },
              { value: 3, label: '已驳回' },
            ]}
          />
          <Select
            style={{ width: 130 }}
            value={hasPhoto}
            onChange={(value) => {
              setPage(1);
              setHasPhoto(value);
            }}
            options={[
              { value: 'all', label: '照片：全部' },
              { value: 'has', label: '已有照片' },
              { value: 'none', label: '缺照片' },
            ]}
          />
          <Button icon={<ReloadOutlined />} onClick={() => refreshAll()}>
            刷新
          </Button>
          {has('card:face:upload') && (
            <Button
              icon={<UploadOutlined />}
              onClick={() => {
                setBatchResult(null);
                setBatchOpen(true);
              }}
            >
              批量导入 ZIP
            </Button>
          )}
        </Space>
      </Card>

      <Card size="small">
        <List
          loading={loading}
          dataSource={rows}
          grid={{ gutter: 12, xs: 1, sm: 2, md: 3, lg: 4, xl: 4, xxl: 6 }}
          locale={{ emptyText: <Empty description="没有符合条件的人员" /> }}
          pagination={{
            current: page,
            pageSize,
            total,
            showSizeChanger: true,
            pageSizeOptions: [12, 24, 48, 96],
            showTotal: (count) => `共 ${count} 人`,
            onChange: (nextPage, nextSize) => {
              setPage(nextPage);
              setPageSize(nextSize);
            },
          }}
          renderItem={(item) => (
            <List.Item key={item.personId}>
              <Card size="small" className="card-face-card" hoverable>
                <div className="card-face-card-body">
                  <FaceThumb personId={item.personId} hasPhoto={item.hasPhoto} size={96} />
                  <div className="card-face-meta">
                    <strong>{item.personName ?? '-'}</strong>
                    <span>{item.personNo ?? '-'}</span>
                    <span>{item.deptName ?? '未分配部门'}</span>
                    <span>{item.hasPhoto ? `更新：${formatDateTime(item.photoTime)}` : '未采集照片'}</span>
                  </div>
                </div>
                <div className="card-face-tags">
                  {faceStatusTag(item.faceStatus)}
                  {item.faceStatus === 3 && item.reviewReason ? (
                    <Tooltip title={`驳回原因：${item.reviewReason}`}>
                      <Tag color="red">{`原因：${item.reviewReason.length > 8 ? `${item.reviewReason.slice(0, 8)}…` : item.reviewReason}`}</Tag>
                    </Tooltip>
                  ) : null}
                  {item.hasPhoto ? <Tag>{Math.ceil((item.photoBytes ?? 0) / 1024)} KB</Tag> : null}
                  {item.reviewUser ? <Tag color="blue">{item.reviewUser}</Tag> : null}
                </div>
                <Space size="small" wrap className="card-face-actions">
                  {has('card:face:upload') && (
                    <Button type="link" size="small" onClick={() => setPhotoTarget(item)}>
                      {item.hasPhoto ? '替换' : '上传'}
                    </Button>
                  )}
                  {has('card:face:review') && item.hasPhoto > 0 && (
                    <Button type="link" size="small" icon={<CheckOutlined />} onClick={() => handleApprove(item)}>
                      通过
                    </Button>
                  )}
                  {has('card:face:review') && item.hasPhoto > 0 && (
                    <Button
                      type="link"
                      size="small"
                      danger
                      icon={<CloseOutlined />}
                      onClick={() => {
                        setRejectReason('');
                        setRejectTarget(item);
                      }}
                    >
                      驳回
                    </Button>
                  )}
                  {has('card:face:delete') && item.hasPhoto > 0 && (
                    <Popconfirm title="确认清空该人员照片？" onConfirm={() => handleDelete(item)}>
                      <Button type="link" size="small" danger icon={<DeleteOutlined />}>
                        清空
                      </Button>
                    </Popconfirm>
                  )}
                  {has('card:face:export') && item.hasPhoto > 0 && (
                    <Button type="link" size="small" onClick={() => handleDownload(item)}>
                      原图
                    </Button>
                  )}
                  {!has('card:face:upload') && !has('card:face:review') && !has('card:face:delete') && !has('card:face:export') ? (
                    <span className="card-muted">只读</span>
                  ) : null}
                </Space>
              </Card>
            </List.Item>
          )}
        />
      </Card>

      <Modal
        title={photoTarget ? `${photoTarget.personName ?? ''} 的照片` : '照片维护'}
        open={Boolean(photoTarget)}
        onCancel={() => setPhotoTarget(null)}
        footer={null}
        width={460}
        destroyOnClose
      >
        {photoTarget ? (
          <div className="card-face-uploader">
            <FaceThumb
              personId={photoTarget.personId}
              hasPhoto={photoTarget.hasPhoto}
              size={220}
              thumb={!has('card:face:export')}
            />
            <p className="card-muted">
              支持 JPG、PNG，单张不超过 5MB；系统按移动端人脸采集同一规则压缩至 80K 以下，并自动完成人脸与姿态审核。通过后直接置为已通过，未通过自动驳回并写入原因。
            </p>
            {photoTarget.faceStatus === 3 && photoTarget.reviewReason ? (
              <p className="card-muted" style={{ color: '#a32d2d' }}>
                驳回原因：{photoTarget.reviewReason}（重新上传后该原因会清除）
              </p>
            ) : null}
            <Upload
              accept="image/jpeg,image/png"
              showUploadList={false}
              beforeUpload={(file) => handleUpload(file as File)}
              disabled={uploading}
            >
              <Button type="primary" icon={<UploadOutlined />} loading={uploading}>
                选择照片上传
              </Button>
            </Upload>
            {photoTarget.hasPhoto > 0 && has('card:face:delete') ? (
              <Popconfirm
                title="确认清空该人员照片？"
                onConfirm={async () => {
                  await handleDelete(photoTarget);
                  setPhotoTarget(null);
                }}
              >
                <Button danger icon={<DeleteOutlined />} style={{ marginLeft: 8 }}>
                  清空照片
                </Button>
              </Popconfirm>
            ) : null}
            <p className="card-muted">历史备份保留最近 3 份，特征生成与下发由 5501 服务负责。</p>
          </div>
        ) : null}
      </Modal>

      <Modal
        title="驳回原因"
        open={Boolean(rejectTarget)}
        onOk={handleReject}
        onCancel={() => setRejectTarget(null)}
        okText="确认驳回"
        okButtonProps={{ danger: true }}
        destroyOnClose
      >
        <Input.TextArea
          rows={3}
          maxLength={100}
          showCount
          value={rejectReason}
          onChange={(event) => setRejectReason(event.target.value)}
          placeholder="请说明照片不合格的原因，便于人员重新采集"
        />
      </Modal>

      <Modal
        title="批量导入照片"
        open={batchOpen}
        onCancel={() => setBatchOpen(false)}
        footer={null}
        destroyOnClose
      >
        <p className="card-muted">
          请上传 ZIP 压缩包，图片文件名使用人员编号或卡号（如 P000001.jpg）。单张不超过 5MB，压缩包内文件不超过 3000 个。导入时逐张压缩至 80K 以下并自动审核，未通过的照片自动驳回并写入原因。
        </p>
        <Upload accept=".zip" showUploadList={false} beforeUpload={(file) => handleBatch(file as File)} disabled={batching}>
          <Button type="primary" icon={<UploadOutlined />} loading={batching}>
            选择 ZIP 上传
          </Button>
        </Upload>
        {batchResult ? <p className="card-batch-result">{batchResult}</p> : null}
      </Modal>
    </div>
  );
}
