import { useEffect, useMemo, useState } from 'react';
import { Input, Modal } from 'antd';
import { AppstoreOutlined, SearchOutlined } from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import { buildMenuSearchIndex, filterMenuByPermission, navigation } from '@/config/menu';
import { useAuth } from '@/store/auth';

interface GlobalSearchProps {
  open: boolean;
  onClose: () => void;
}

/** 全局菜单搜索：索引取自权限过滤后的导航树，保证搜到的都能进 */
export default function GlobalSearch({ open, onClose }: GlobalSearchProps) {
  const navigate = useNavigate();
  const { permissions } = useAuth();
  const [keyword, setKeyword] = useState('');

  const index = useMemo(
    () => buildMenuSearchIndex(filterMenuByPermission(navigation, permissions)),
    [permissions],
  );

  const results = useMemo(() => {
    const lower = keyword.trim().toLowerCase();
    const matched = lower
      ? index.filter((entry) => entry.title.toLowerCase().includes(lower) || entry.trail.toLowerCase().includes(lower))
      : index;
    return matched.sort((a, b) => a.depth - b.depth || a.title.localeCompare(b.title, 'zh-Hans-CN')).slice(0, 8);
  }, [index, keyword]);

  useEffect(() => {
    if (open) setKeyword('');
  }, [open]);

  const go = (path: string) => {
    navigate(path);
    onClose();
    setKeyword('');
  };

  return (
    <Modal open={open} onCancel={onClose} footer={null} closable={false} width={600} className="search-modal">
      <Input
        autoFocus
        size="large"
        prefix={<SearchOutlined />}
        placeholder="输入功能名称或路径，如：人员档案"
        value={keyword}
        onChange={(event) => setKeyword(event.target.value)}
        onPressEnter={() => results[0] && go(results[0].path)}
      />
      <div className="search-result-caption">
        {keyword ? `找到 ${results.length} 个功能` : `可访问功能 ${index.length} 个，展示常用入口`}
      </div>
      <div className="search-results">
        {results.map((entry) => (
          <button key={entry.path} className="search-result" onClick={() => go(entry.path)}>
            <span className="search-result-icon">
              <AppstoreOutlined />
            </span>
            <span>
              <strong>{entry.title}</strong>
              <small>{entry.trail}</small>
            </span>
            <span className="search-enter">↵</span>
          </button>
        ))}
        {results.length === 0 && <div className="search-empty">未找到匹配的功能，请换个关键词</div>}
      </div>
    </Modal>
  );
}
