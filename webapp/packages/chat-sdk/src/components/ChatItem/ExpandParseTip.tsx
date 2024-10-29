import React, { ReactNode } from 'react';
import { ChatContextType, DateInfoType, EntityInfoType, FilterItemType } from '../../common/type';
import { Button, DatePicker, Row, Col, Tag } from 'antd';
import { CheckCircleFilled, CloseCircleFilled, ReloadOutlined } from '@ant-design/icons';
import Loading from './Loading';
import FilterItem from './FilterItem';
import classNames from 'classnames';
import { isMobile } from '../../utils/utils';
import dayjs, { Dayjs } from 'dayjs';
import quarterOfYear from 'dayjs/plugin/quarterOfYear';
import { prefixCls, getTipNode } from './ParseTipUtils';

import 'dayjs/locale/zh-cn';

dayjs.extend(quarterOfYear);
dayjs.locale('zh-cn');

const { RangePicker } = DatePicker;

type Props = {
  parseLoading: boolean;
  parseInfoOptions: ChatContextType[];
  parseTip: string;
  currentParseInfo?: ChatContextType;
  agentId?: number;
  dimensionFilters: FilterItemType[];
  dateInfo: DateInfoType;
  entityInfo: EntityInfoType;
  integrateSystem?: string;
  parseTimeCost?: number;
  isDeveloper?: boolean;
  onSelectParseInfo: (parseInfo: ChatContextType) => void;
  onSwitchEntity: (entityId: string) => void;
  onFiltersChange: (filters: FilterItemType[]) => void;
  onDateInfoChange: (dateRange: any) => void;
  onRefresh: (parseInfo: ChatContextType) => void;
  handlePresetClick: any;
};

type RangeValue = [Dayjs, Dayjs];
type RangeKeys = '近7日' | '近14日' | '近30日' | '本周' | '本月' | '上月' | '本季度' | '本年';

const ExpandParseTip: React.FC<Props> = ({
  parseLoading,
  parseInfoOptions,
  parseTip,
  currentParseInfo,
  agentId,
  dimensionFilters,
  dateInfo,
  entityInfo,
  integrateSystem,
  parseTimeCost,
  isDeveloper,
  onSelectParseInfo,
  onSwitchEntity,
  onFiltersChange,
  onDateInfoChange,
  onRefresh,
  handlePresetClick,
}) => {
  const ranges: Record<RangeKeys, RangeValue> = {
    近7日: [dayjs().subtract(7, 'day'), dayjs()],
    近14日: [dayjs().subtract(14, 'day'), dayjs()],
    近30日: [dayjs().subtract(30, 'day'), dayjs()],
    本周: [dayjs().startOf('week'), dayjs().endOf('week')],
    本月: [dayjs().startOf('month'), dayjs().endOf('month')],
    上月: [
      dayjs().subtract(1, 'month').startOf('month'),
      dayjs().subtract(1, 'month').endOf('month'),
    ],
    本季度: [dayjs().startOf('quarter'), dayjs().endOf('quarter')], // 使用 quarterOfYear 插件
    本年: [dayjs().startOf('year'), dayjs().endOf('year')],
  };

  const getNode = (tipTitle: ReactNode, tipNode?: ReactNode, failed?: boolean) => {
    return (
      <div className={`${prefixCls}-parse-tip`}>
        <div className={`${prefixCls}-title-bar`}>
          {!failed ? (
            <CheckCircleFilled className={`${prefixCls}-step-icon`} />
          ) : (
            <CloseCircleFilled className={`${prefixCls}-step-error-icon`} />
          )}
          <div className={`${prefixCls}-step-title`}>
            {tipTitle}
            {tipNode === undefined && <Loading />}
          </div>
        </div>
        {(tipNode || tipNode === null) && (
          <div
            className={classNames(
              `${prefixCls}-content-container`,
              tipNode === null && `${prefixCls}-empty-content-container`,
              failed && `${prefixCls}-content-container-failed`
            )}
          >
            {tipNode}
          </div>
        )}
      </div>
    );
  };

  if (parseLoading) {
    return getNode('意图解析中');
  }

  if (parseTip) {
    return getNode(
      <>
        意图解析失败
        {!!parseTimeCost && isDeveloper && (
          <span className={`${prefixCls}-title-tip`}>(耗时: {parseTimeCost}ms)</span>
        )}
      </>,
      parseTip,
      true
    );
  }

  if (parseInfoOptions.length === 0) {
    return null;
  }

  const { modelId, queryMode, entity, nativeQuery } = currentParseInfo || {};

  const entityAlias = entity?.alias?.[0]?.split('.')?.[0];

  const getFilterContent = (filters: any) => {
    const itemValueClass = `${prefixCls}-tip-item-value`;
    const { startDate, endDate } = dateInfo || {};
    const tipItemOptionClass = classNames(`${prefixCls}-tip-item-option`, {
      [`${prefixCls}-mobile-tip-item-option`]: isMobile,
    });
    return (
      <div className={`${prefixCls}-tip-item-filter-content`}>
        {!!dateInfo && (
          <div className={tipItemOptionClass}>
            <span className={`${prefixCls}-tip-item-filter-name`}>数据时间：</span>
            {nativeQuery ? (
              <span className={itemValueClass}>
                {startDate === endDate ? startDate : `${startDate} ~ ${endDate}`}
              </span>
            ) : (
              <RangePicker
                value={[dayjs(startDate), dayjs(endDate)]}
                onChange={onDateInfoChange}
                format="YYYY-MM-DD"
                renderExtraFooter={() => (
                  <Row gutter={[28, 28]}>
                    {Object.keys(ranges).map(key => (
                      <Col key={key}>
                        <Button
                          size="small"
                          onClick={() => handlePresetClick(ranges[key as RangeKeys])}
                        >
                          {key}
                        </Button>
                      </Col>
                    ))}
                  </Row>
                )}
              />
            )}
          </div>
        )}
        {filters?.map((filter: any, index: number) => (
          <FilterItem
            modelId={modelId!}
            filters={filters}
            filter={filter}
            index={index}
            chatContext={currentParseInfo!}
            entityAlias={entityAlias}
            agentId={agentId}
            integrateSystem={integrateSystem}
            onFiltersChange={onFiltersChange}
            onSwitchEntity={onSwitchEntity}
            key={`${filter.name}_${index}`}
          />
        ))}
      </div>
    );
  };

  const getFiltersNode = parseInfo => {
    return (
      <>
        {(!!dateInfo || !!dimensionFilters?.length) && (
          <div className={`${prefixCls}-tip-item`}>
            <div className={`${prefixCls}-tip-item-name`}>筛选条件：</div>
            <div className={`${prefixCls}-tip-item-content`}>
              {getFilterContent(dimensionFilters)}
            </div>
          </div>
        )}
      </>
    );
  };

  return getNode(
    <div className={`${prefixCls}-title-bar`}>
      <div>
        意图解析
        {!!parseTimeCost && isDeveloper && (
          <span className={`${prefixCls}-title-tip`}>(耗时: {parseTimeCost}ms)</span>
        )}
      </div>
    </div>,
    queryMode === 'PLAIN_TEXT' ? null : (
      <>
        <div>
          {parseInfoOptions.map((parseInfo, index) => {
            const { queryMode, properties } = parseInfo || {};
            const { type: agentType } = properties || {};
            return (
              <div style={{ marginBottom: 10, paddingBottom: 10, borderBottom: '1px solid #eee' }}>
                <div style={{ marginBottom: 10, height: '30px', lineHeight: '30px' }}>
                  <span className={`${prefixCls}-content-parser-options-title`}>
                    解析{index + 1}:
                  </span>
                </div>
                <div className={`${prefixCls}-tip`}>
                  {getTipNode({ parseInfo, dimensionFilters, entityInfo })}
                  {!(!!agentType && queryMode !== 'LLM_S2SQL') && getFiltersNode(parseInfo)}
                </div>
              </div>
            );
          })}
          {parseInfoOptions?.length > 1 && (
            <div className={`${prefixCls}-content-parser-container`}>
              <div className={`${prefixCls}-content-options`}>
                <span className={`${prefixCls}-breathing-text`}>
                  请选择适合的解析意图，并进行下一步:
                </span>
                {parseInfoOptions.map((parseInfo, index) => (
                  <div
                    className={`${prefixCls}-content-option ${
                      parseInfo.id === currentParseInfo?.id
                        ? `${prefixCls}-content-option-active`
                        : ''
                    }`}
                    onClick={() => {
                      onSelectParseInfo(parseInfo);
                    }}
                    key={parseInfo.id}
                  >
                    解析{index + 1}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </>
    )
  );
};

export default ExpandParseTip;